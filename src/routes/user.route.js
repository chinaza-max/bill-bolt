
import { Router } from "express";
import UserController from"../controllers/user/user.controller.js";
import uploadHandler from "../middlewares/upload.middleware.js";

class UserRoutes extends UserController {

  constructor() {
    super();
    this.router = Router();
    this.routes();
  }

  routes() {

    this.router.post("/updateProfile",uploadHandler.image.single('image'), this.updateProfile);
    this.router.post("/updatePin", this.updatePin);
    this.router.post("/verifyNIN", this.verifyNIN);



    /*
    this.router.get("/whoIAm", this.whoIAm);
    */

  } 

}

export default new UserRoutes().router;
