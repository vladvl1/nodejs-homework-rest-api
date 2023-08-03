import express from "express";

import {authController} from '../../controllers/index.js';

import usersSchemas from "../../schemas/users-schemas.js";

import {validateBody} from "../../decorators/index.js";

import {authenticate,upload,isEmptyBody,isValidId} from "../../middlewares/index.js";

import contactsSchemas from "../../schemas/contacts-schemas.js";

import {contactsController} from "../../controllers/index.js";


const authRouter = express.Router();

authRouter.post("/register", validateBody(usersSchemas.userRegisterSchema), authController.register);

authRouter.post("/login", validateBody(usersSchemas.userLoginSchema), authController.login);

authRouter.get("/current", authenticate, authController.getCurrent);

authRouter.post("/logout", authenticate, authController.logout);

authRouter.patch("/avatars",authenticate,upload.single("avatar"),isEmptyBody,validateBody(contactsSchemas.contactAddSchema),contactsController.updateAvatar);

export default authRouter;