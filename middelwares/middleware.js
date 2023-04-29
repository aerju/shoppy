
module.exports = {
 checkAdminLoggedIn : (req, res, next) => {
    if (req.session.adminLoggedIn) {
        next();
    } else {
        res.redirect('/admin');
    }
}, sessionHandle : (req,res,next)=>{
   
    if(req.session.userLoggedIn){
      res.redirect('/')
    }else{
      next();
    }
  
  },
  checkUserLoggedIn:(req,res,next)=>{
    if (req.session.userLoggedIn) {
      next();
  } else {
      res.redirect('/login');
  }
  }
}