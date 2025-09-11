class FederatedLogger
{
    //------------------ Constructor ------------------
    constructor()
    {
        //Ensure only one FederatedLogger can be created
        if (FederatedLogger._instance) {
            return FederatedLogger._instance;
        }
        FederatedLogger._instance = this;
    }

    //------------------ Methods ------------------
    log(content)
    {
        console.log(`FEDERATED: ${content}`);
    }
}

module.exports = FederatedLogger