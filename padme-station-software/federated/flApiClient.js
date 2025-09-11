const { resolveCentralServiceAccessTokenCore } = require('../validation/auth');
const { FLStatusUpdates } = require('./flConstants.js');
const FederatedLogger = require('./federatedLogger.js');
const { backOff } = require("exponential-backoff");
var Mutex = require('async-mutex').Mutex;
const EventEmitter = require('events');
const { Readable } = require("stream");
const request = require('request');
const util = require('util');
const resolveCentralServiceAccessTokenAsync = util.promisify(resolveCentralServiceAccessTokenCore);
const zlib = require('node:zlib');
const { utility } = require('../utils');

class StatusCodeError extends Error {
    constructor(code) {
        super(`Status code did not indicate success (code ${code})`);
        this.code = code;
        this.name = "StatusCodeError";
    }
}

class FLApiClient extends EventEmitter {

    //------------------ Properties ------------------
    #logger;
    #baseUrl;
    #jobId;
    #lastEvent;
    #successStatusCodes; 5
    #emitEvents;
    #eventsMutex;
    //------------------ Constructor ------------------

    /**
     * Creates a new jobWorker instance for the provided jobId
     * @param {string} logging function that get called to write logs
     */
    constructor(jobId) {
        super();
        this.#jobId = jobId;
        this.#logger = new FederatedLogger();
        this.#baseUrl = `${utility.getCSTargetURL()}/api/`;
        this.#lastEvent = 0;
        //Status codes that are considered as successful by the client
        this.#successStatusCodes = [200, 201, 204];
        this.#emitEvents = false;
        this.#eventsMutex = new Mutex();
    }

    //------------------ private Methods ------------------
    /**
     * Logs a new log message for this worker
     * @param {*} content 
     */
    #log(content) {
        this.#logSelf(this, content);
    }

    /**
     * Logs a new log message for this worker
     * @param {*} content 
     */
    #logSelf(self, content) {
        self.#logger.log(`${self.#jobId} APICLIENT - ${content}`);
    }

    /**
     * Checks if the provided object is a readable stream
     * @param {*} object object that should be tested
     * @returns wether the provided object is a readable stream
     */
    #isReadableStream(object) {
        return object instanceof EventEmitter && typeof object.read === 'function';
    }

    /**
     * Notifies all event subscriber, that a new FL event is available
     * @param {*} event A List of events
     * @param {FLApiClient} self a reference to the current api client
     */
    async #emitNewFlEvent(self, events) {
        if (await self.#shouldEmitEvents(self)) {
            events.forEach(event => this.emit('flEvent', event));
        }
    }

    /**
     * Returns whether FL events should be emitted
     * @param {FLApiClient} self a reference to the current api client
     */
    #shouldEmitEvents(self) {
        return self.#eventsMutex.runExclusive(() => {
            return self.#emitEvents;
        });
    }

    /**
     * Returns the options that should be used for the exponential backoff
     * @param {*} retryFunction 
     * @returns 
     */
    #getBackOffOptions(retryFunction) {
        return {
            retry: retryFunction,
            jitter: "full",
            numOfAttempts: 12, //Waits up to ~ 17 Minutes for the next request
            startingDelay: 1000 //Start with 1 second between requests
        }
    }

    async #pollFlEvents() {
        var self = this;
        var log = (content) => self.#logSelf(self, content);
        //Resolve options with retry function
        var options = this.#getBackOffOptions(async (error, attemptNumber) => {
            log(`Attempt number ${attemptNumber} for events endpoint failed with error: ${error}`);
            //Returns whether further requests are required
            return await self.#shouldEmitEvents(self);
        });

        //while we should emit events poll the end point
        do {
            try {
                //Use the exponential backup 
                const eventList = await backOff(() => this.#getJson(`federatedjobinfo/${process.env.STATION_ID}/${this.#jobId}/events?since=${this.#lastEvent}`), options);
                // process response
                if (eventList.length > 0) {
                    log(`Received ${eventList.length} events`);
                    await self.#emitNewFlEvent(self, eventList);
                    //Get maximum id as new last event
                    self.#lastEvent = Math.max.apply(null, eventList.map((event) => event.id));
                    log(`New last Event id is ${self.#lastEvent}`);
                }
            } catch (err) {
                log(`Round of backoff failed with reason: ${err}`);
            }
        } while (await self.#shouldEmitEvents(self) === true);
        log("Stopped listening for events endpoint");
    }

    //------------------ private HTTP related Methods (get, post, etc.) ------------------

    /**
     * 
     * @param {*} body The content of the body of the request
     * @param {*} path The path at which the request should be send
     * @param {*} token The Bearer token that should be used for authentication 
     * @returns An object with the corresponding option values
     */
    #getOptions(path, body, contentType, encoding, token, contentEncoding) {
        let options = {
            url: `${this.#baseUrl}${path}`,
            body: body,
            headers: {
                'Content-Type': contentType,
                'Authorization': `Bearer ${token}`,
            },
            //Encoding should be null for binary data, default is undefined
            encoding: encoding
        };

        if (contentEncoding) {
            options.headers['Content-Encoding'] = contentEncoding;
        }

        return options;
    }

    /**
     * Executes the provided http method
     * @param {*} method 
     * @param {*} options 
     * @param {*} stream that should be piped into the execution. Use null if none
     * @returns A Promise, rejecting on error and accepting otherwise
     */
    async #execute(method, options, stream, contentEncoding) {
        var self = this;
        var log = (content) => self.#logSelf(self, content);
        return new Promise((res, rej) => {

            if (stream == null) {
                stream = { pipe: (id) => id }
            }
            if (contentEncoding === 'gzip') {
                stream = stream.pipe(zlib.createGzip());
            }

            stream.pipe(method(options, (error, response) => {
                if (error) {
                    log(error.message);
                    rej(error.message);
                    return;
                }
                log(response.statusCode);
                if (this.#successStatusCodes.includes(response.statusCode)) {
                    res(response);
                } else {
                    rej(new StatusCodeError(response.statusCode));
                }
            }));
        });
    }

    /**
     * Posts the provided content to the given path
     * @param {string} path The path to request
     * @param {*} body The body to send
     * @param {string} contentType contentType of the post
     * @param {boolean} forceAuthRefresh Whether a refresh of the authentication token should be forced (can e.g. be used to ensure long running requests are properly authenticated)
     * @return a Promise for the request
     */
    async #post(path, body, contentType, forceAuthRefresh, contentEncoding) {
        var self = this;
        var log = (content) => self.#logSelf(self, content);

        try {
            var token = await resolveCentralServiceAccessTokenAsync(forceAuthRefresh);
            log(`POST to ${path}`);

            var options = this.#getOptions(path, this.#isReadableStream(body) ? null : body, contentType, undefined, token, contentEncoding);
            return this.#execute(request.post, options, this.#isReadableStream(body) ? body : null, contentEncoding);
        } catch
        {
            return Promise.reject("Could not resolve access token for centralService");
        }
    }

    /**
     * Gets the content from the requested path
     * @param {*} path The path to request
     * @param {*} body The body to send
     * @param {*} encoding, should be null for binary data and undefined otherwise
     * @returns A Promise for the request that resolves in a http request
     */
    async #get(path, contentType, encoding = undefined) {
        var self = this;
        var log = (content) => self.#logSelf(self, content);

        try {
            var token = await resolveCentralServiceAccessTokenAsync(false);
            log(`GET from ${path}`);

            var options = this.#getOptions(path, null, contentType, encoding, token);
            return this.#execute(request.get, options, null);
        } catch
        {
            return Promise.reject("Could not resolve access token for centralService");
        }
    }

    /**
     * Returns the body content of a http request
     * @param {*} path 
     */
    async #getBody(path, contentType)
    {
        return new Promise((res, rej) => {
            this.#get(path, contentType).then((response) => {
                res(response.body);
            }).catch((err) => rej(err));
        });
    }

     /**
     * Returns the body content of a http request
     * @param {*} path 
     */
      async #postJson(path, body)
      {
          return new Promise((res, rej) => {
              this.#post(path, body, 'application/json', false).then((response) => 
              {
                  res(response.body);
              }).catch((err) => rej(err));
          });
      }
  
    /**
     * Gets the content from the requested path
     * @param {*} path The path to request
     * @param {*} body The body to send
     * @returns A Promise for the request
     */
     async #getJson(path)
     {
         return new Promise((res, rej) => {
             this.#getBody(path, 'application/json').then((result) => 
             {
                 try {
                    res(JSON.parse(result));
                 } catch(e)
                 {
                    rej(e);
                 }
             }).catch((err) => rej(err));
         });
     }
    
    /**
     * Post a Status update to the CS with the given Status
     * @param {FLStatusUpdates} newStatus The new status of the Station
     * @param {string} message message that should be send along with the update
     */
    #postStatusUpdate(newStatus, message)
    {
        return this.#postJson(`federatedjobinfo/${process.env.STATION_ID}/${this.#jobId}/status`, JSON.stringify({
            status: newStatus,
            message: message
        }));
    }

    /**
     * Post a Status update to the CS with the given Status and message.
     * In case the udpate fails, the post is retried till it succeeds or an unexpected status
     * code is received
     * @param {FLStatusUpdates} newStatus The new status of the Station
     * @param {string} message message that should be send along with the update
     */
    async #postStatusUpdateWithRetries(newStatus, message)
    {
        //We use retries to send the update in case there is a flakey connection
        //or something else preventing the update
        var self = this;
        var log = (content) => self.#logSelf(self, content);
        var options = self.#getBackOffOptions(async (error, attemptNumber) => {
            log(`Attempt number ${attemptNumber} for sending status: ${newStatus} update. Error: ${error}`);
            return true;
        });

        let success = false;
        do {
            try {
                await backOff(() => self.#postStatusUpdate(newStatus, message), options);
                success = true;
            } catch (err) {
                if (err instanceof StatusCodeError) {
                    success = true;
                    log(`Sending status ${newStatus} update to CS failed because of unexpected status code (${err.code}). Stopping backOff.`)
                } else {
                    log(`Round of backoff for sending status: ${newStatus} update failed with reason: ${err}`);
                }
            }
        } while (!success);
    }

    //------------------ public Methods ------------------
    /**
     * Accepts the job
     * @returns a Promise indicating if the job could be accepted
     */
    async AcceptJob()
    {
        return this.#postStatusUpdateWithRetries(FLStatusUpdates.ACCEPTED, '');
    }

    /**
     * Send an update to the CS that the job failed with a message indicating,
     * that the failure is due to cancelation
     */
    async SendJobCanceled()
    {
        return this.#postStatusUpdateWithRetries(FLStatusUpdates.FAILED, 'Job canceled by user');
    }

    /**
     * Informs the central component that the job failed on this station
     */
    async SendJobFailed()
    {
        return this.#postStatusUpdateWithRetries(FLStatusUpdates.FAILED, '');
    }

    /**
     * Downloads the model to the provided path
     * @returns A promise, resolving with null if no model exists for the round and with a stream otherwise
     */
    async DownloadModel()
    {
        //important: encoding needs to be null for binary data
        return this.#get(`federatedjobinfo/${process.env.STATION_ID}/${this.#jobId}/model`, 'application/x-tar', null)
            .then((response) => {
                if (response.statusCode == 204) {
                    //No Model for this round
                    return Promise.resolve(null);
                } else {
                    return Promise.resolve(Readable.from(response.body));
                }
            });
    }

    /**
     * Pushed the file at the given Path as a model result of the current learning round
     * @param {stream} stream a stream containing the model (tar archive)
     * @returns A Promise that resolves when the push was successful and fails otherwise
     */
    async PushModel(stream) {
        return this.#post(`federatedjobinfo/${process.env.STATION_ID}/${this.#jobId}/result`, stream, 'application/x-tar', true, 'gzip');
    }

    /**
     * Pushes the provided stream as the current logs of the station 
     * @param {*} stream a stream containing the logs (tar archive)
     * @returns A Promise that resolves when the push was successful and fails otherwise
     */
    async PushGlobalStorage(stream) {
        return this.#post(`federatedjobinfo/${process.env.STATION_ID}/${this.#jobId}/storage`, stream, 'application/x-tar', true, 'gzip');
    }

    /**
     * Stops the long polling client that will poll job events
     */
    StopListeningForJobEvents()
    {
        //Update emit events value
        this.#eventsMutex.runExclusive(() => {
            this.#emitEvents = false;
        });
    }

    /**
     * Starts the long polling client that will poll job events
     * When a new event occurs this will be notified via the EventEmitter event 'flEvent'
     */
    StartListeningForJobEvents()
    {
        //Update emit events value
        this.#eventsMutex.runExclusive(() => {
            this.#emitEvents = true;
        });

        //No await here, should be running async, without any waiting
        this.#pollFlEvents();
    }
}

module.exports = FLApiClient