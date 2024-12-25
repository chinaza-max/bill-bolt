import userService from "../../service/user.service.js";
import authService from "../../service/auth.service.js";

export default class UserController {



  async updateProfile(req, res, next) {

    try {
      const data = req.body;        
      const { file } = req;

      let my_bj = {
        ...data,
        userId:req.user.id,
        role:req.user.role,
        image:{
          size:file?.size
        }
      }

       await userService.handleUpdateProfile(my_bj,file);
  
      return res.status(200).json({
        status: 200,
        message: "updated successfully",
      });
       
        
    } catch (error) {
      console.log(error);
      next(error)
    }
    
  }


  
  async updatePin(req, res, next) {

    try {
      const data = req.body;        

      let my_bj = {
        ...data,
        userId:req.user.id,
        role:req.user.role
      }

       await userService.handleUpdatePin(my_bj);
  
      return res.status(200).json({
        status: 200,
        message: "updated successfully",
      });
       
        
    } catch (error) {
      console.log(error);
      next(error)
    }
    
  }



  async verifyNIN(req, res, next) {

    try {
      const data = req.body;        

      let my_bj = {
        ...data,
        userId:req.user.id,
        role:req.user.role
      }

       await userService.handleVerifyNIN(my_bj);
  
      return res.status(200).json({
        status: 200,
        message: "opt has been sent to the number attached to the nin",
      })
       
        
    } catch (error) {
      console.log(error);
      next(error)
    }
    
  }

  

  async updatefcmToken(
    req,
    res,
    next
  ){
    const data=req.body
 
    try {
      
        const my_bj = {
          ...data,
          userId:req.user.id, 
        }
                          
        await userService.handleUpdatefcmToken(my_bj);

        return res.status(200).json({
          status: 200,
          message: "success",
        });
      
     
    } catch (error) {
      console.log(error)
      next(error);
    }
  }

/*
  async whoIAm(
    req,
    res,
    next
  ){
   
    try {
    
        const my_bj = {
          userId:req.user.id
        }
                          
        const result=await userService.handleWhoIAm(my_bj);

      return res.status(200).json({
        status: 200,
        data:result,
      });
    } catch (error) {
      console.log(error)
      next(error);
    }
  }
*/

}
