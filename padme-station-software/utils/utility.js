const asyncHandler = fn => (req, res, next) =>
  Promise
    .resolve(fn(req, res, next))
    .catch((err) => {
      try {
        res.render('error', { user: req.user, error_msg: stringifyErrorMsg(err) });
      } catch (error) {
        next(err)
      }
    });

// https://stackoverflow.com/questions/14446511/most-efficient-method-to-groupby-on-an-array-of-objects
const groupBy = function (xs, key) {
  return xs.reduce(function (rv, x) {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});
};

const combineURLs = (baseURL, relativeURL) => {
  return relativeURL
    ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
    : baseURL;
}

const stringifyErrorMsg = (err) => {
  let msg = err;

  console.log(typeof err);
  console.log(err);

  try {

    // type of object
    try {
      if (typeof err === 'object') {
        msg = err.toString();
        if (msg === "[object Object]") {
          msg = JSON.stringify(err)
        }
      }
    } catch (error) {
      msg = 'Internal Server Error'
      console.log(error);
    }

  }
  catch (error) {
    console.log(error);
  }
  finally {
    return msg;
  }
}

const getCSTargetURL = () => {
  let endPoint = '';
  //If there is an endpoint defined use that
  const envEndpoint = process.env.CENTRALSERVICE_ENDPOINT;
  if (envEndpoint != null && envEndpoint != undefined && envEndpoint.length > 0) {
    endPoint = `/${envEndpoint}`
  }
  return `http://${process.env.CENTRALSERVICE_ADDRESS}:${process.env.CENTRALSERVICE_PORT}${endPoint}`
} 

module.exports = {
  asyncHandler,
  groupBy,
  combineURLs,
  stringifyErrorMsg,
  getCSTargetURL
}