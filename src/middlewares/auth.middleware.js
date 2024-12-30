import authService from "../service/auth.service.js";
import {
  UnAuthorizedError,
  BadRequestError,
} from "../errors/index.js";


class AuthenticationMiddlewares {


  async validateUserToken( req,res,next){
    try {


      const { authorization } = req.headers;

      if ((req.path=='/')||(req.path=="/favicon.ico"))  return next();;

      if (!authorization) throw new BadRequestError("No token provided.");

      const token = authorization.split(" ")[1];

      if (!token) throw new BadRequestError("No token provided.");

      const { payload, expired } = authService.verifyAccessToken(token);

      if (expired) throw new UnAuthorizedError("Invalid token.");

      req.user = payload;
      
      return next();
    } catch (error) { 
      console.log(error)
      next(error);
    }
  }
  
/*
  async validateRefreshToken( req,res,next){
    try {

      const token = req.cookies.refresh_token;

      if(token){

      }
      else{
        next()
      }

      if ((req.path=='/')||(req.path=="/favicon.ico"))  return next();;

      if (!authorization) throw new BadRequestError("No token provided.");

      const token = authorization.split(" ")[1];

      if (!token) throw new BadRequestError("No token provided.");

      const { payload, expired } = authService.verifyAccessToken(token);

      if (expired) throw new UnAuthorizedError("Invalid token.");

      req.user = payload;
      
      return next();
    } catch (error) { 
      console.log(error)
      next(error);
    }
  }
  */


}

export default new AuthenticationMiddlewares();
