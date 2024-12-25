import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import authRoute from "./auth.route.js";
import userRoute from "./user.route.js";


class Routes {

  constructor() {
    this.router = Router();
    this.routes();
  }

  routes(){
    let rootAPI = "/api/v1";
    this.router.get("/").get(`${rootAPI}/`, (req , res) => {
      return res.status(200).json({                                                                                                                                      
        status: 200,
        message: "Welcome to   App API",
        data: {
          service: "LAGProperty",
          version: "1.0.0",
        },
      });
    });
 

    
    this.router.use(`${rootAPI}/auth`, authRoute)

    this.router.use(authMiddleware.validateUserToken);

    this.router.use(`${rootAPI}/user`, userRoute)
    

    this.router.all("*", (req, res) => {
      res.status(404).json({
        status: 404,
        message: 'Resource not found.',
      });

    });
  }
}

export default new Routes().router;
