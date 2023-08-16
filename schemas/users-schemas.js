import Joi from "joi";

import { emailRegexp } from "../constants/user-constants.js";

const userRegisterSchema = Joi.object({
    email: Joi.string().pattern(emailRegexp).required(),
    password: Joi.string().min(6).required(),
})

const userLoginSchema = Joi.object({
    email: Joi.string().pattern(emailRegexp).required(),
    password: Joi.string().min(6).required(),
})
const userEmailSchema = Joi.object({
    email: Joi.string().pattern(emailRegexp).required().messages({
        "any.required":`missing required field email`,
    })
})

export default {
    userRegisterSchema,
    userLoginSchema,
    userEmailSchema,
}