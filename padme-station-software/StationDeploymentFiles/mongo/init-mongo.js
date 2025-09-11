//This is not really a js file but only a collection of mongo commands
//You can test it out by going into the mongo container, typing 'mongo'
//and then executing the contents of this file line-by-line
db = db.getSiblingDB('pht')
password=_getEnv('MONGO_PHT_ADMIN_PASSWORD')
db.createUser(
	{
		user: "admin",
		pwd: password,
		roles: [
			{
				role: "readWrite",
				db: "pht"
			},
			{
				role: "dbAdmin",
				db: "pht"
			}
		],
		mechanisms: ["SCRAM-SHA-1"]
	}
)