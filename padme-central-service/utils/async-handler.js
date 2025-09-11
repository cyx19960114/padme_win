const asyncHandler = fn => (req, res, next) =>
  Promise
    .resolve(fn(req, res, next))
    .catch((err) => {
      console.log(err);
      // TODO: Add more specific details of the error 
      // better to not forward err object to ui => sec issue 
      next(500);
    });


module.exports = {
  asyncHandler,
}