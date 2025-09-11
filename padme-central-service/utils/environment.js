module.exports = {
    getEnvOrThrow: (name) => {
        const val = process.env[name];
        if ((val === undefined) || (val === null) || val === "") {
            throw Error(`Environment variable ${name} is required but not defined`);
        }
        return val;
    }
}