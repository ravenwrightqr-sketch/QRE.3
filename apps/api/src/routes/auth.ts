import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "@qre/db";
import { Express, Request, Response } from "express";
import {
  requireAuth,
  type AuthRequest,
} from "../middleware/requireAuth.js";


const JWT_SECRET = process.env.JWT_SECRET as string;


if (!JWT_SECRET) {
  throw new Error("JWT_SECRET missing");
}



export function authRoutes(app: Express) {


  /**
   * =========================
   * REGISTER
   * =========================
   *
   * Creates:
   *
   * User
   *   ↓
   * Personal Account
   *   ↓
   * AccountUser OWNER
   *
   * User never owns assets directly.
   *
   */
  app.post(
    "/auth/register",
    async(
      req:Request,
      res:Response
    )=>{


      try {


        const {
          email,
          password,
        } = req.body;



        if(!email || !password){

          return res.status(400).json({
            error:"missing fields",
          });

        }



        const exists =
          await db.user.findUnique({
            where:{
              email,
            },
          });



        if(exists){

          return res.status(409).json({
            error:"user exists",
          });

        }



        const hashed =
          await bcrypt.hash(
            password,
            10
          );



        /**
         * CREATE USER
         */
        const user =
          await db.user.create({

            data:{
              email,
              password:hashed,
            },

          });



        /**
         * CREATE PERSONAL ACCOUNT
         */
        const account =
          await db.account.create({

            data:{
              name:
                email.split("@")[0],

              type:
                "CONSUMER",

              plan:
                "CONSUMER",

            },

          });



        /**
         * LINK USER TO ACCOUNT
         */
        await db.accountUser.create({

          data:{

            accountId:
              account.id,

            userId:
              user.id,

            role:
              "OWNER",

          },

        });



        const token =
          jwt.sign(

            {
              userId:user.id,
              email:user.email,
            },

            JWT_SECRET,

            {
              expiresIn:"30d",
            }

          );



        return res.json({

          token,

          user:{

            id:user.id,

            email:user.email,

            accountId:
              account.id,

          },

        });



      }
      catch(e:any){

        return res.status(500).json({
          error:e.message,
        });

      }


    }
  );





  /**
   * =========================
   * LOGIN
   * =========================
   */
  app.post(
    "/auth/login",
    async(
      req:Request,
      res:Response
    )=>{


      try{


        const {
          email,
          password,
        } = req.body;



        const user =
          await db.user.findUnique({

            where:{
              email,
            },

          });



        if(!user){

          return res.status(401).json({
            error:"invalid credentials",
          });

        }



        const valid =
          await bcrypt.compare(
            password,
            user.password
          );



        if(!valid){

          return res.status(401).json({
            error:"invalid credentials",
          });

        }



        const token =
          jwt.sign(

            {
              userId:user.id,
              email:user.email,
            },

            JWT_SECRET,

            {
              expiresIn:"30d",
            }

          );



        return res.json({

          token,

          user:{

            id:user.id,

            email:user.email,

          },

        });



      }
      catch(e:any){

        return res.status(500).json({
          error:e.message,
        });

      }


    }
  );






  /**
   * =========================
   * RESTORE SESSION
   * =========================
   */
  app.get(
    "/auth/me",
    requireAuth,
    async(
      req:AuthRequest,
      res:Response
    )=>{


      try{


        const user =
          await db.user.findUnique({

            where:{
              id:req.user!.userId,
            },


           select:{

  id:true,

  email:true,

  AccountUser:{

    select:{

      accountId:true,

      role:true,

      Account:{

        select:{

          id:true,

          name:true,

          type:true,

          plan:true,

        },

      },

    },

  },

},

          });



        if(!user){

          return res.status(404).json({
            error:"User not found",
          });

        }



        return res.json({
          user,
        });



      }
      catch(e:any){

        return res.status(500).json({
          error:e.message,
        });

      }


    }
  );



}