/*
	Method used to check if the authenticated user has rights to perform a certain action.
	To do: add middleware for those paths which require authentication
*/

exports.isAuthenticated = function (req, res, next) {
 //console.log("User :" +req.user.username);
 //at this point I should be able to add things like accountNumber, etc.
  if (req.isAuthenticated())
    return next();
  res.redirect('/');
}