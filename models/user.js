import { Schema, model } from "mongoose";
import { handleSaveError, handleUpdateValidate } from "./hooks.js";
import { emailRegexp } from "../constants/user-constants.js";

const userSchema = new Schema({
        password: {
          type: String,
          required: [true, 'Password is required'],
        },
        email: {
          type: String,
          required: [true, 'Email is required'],
          unique: true,
          match: emailRegexp
        },
        subscription: {
          type: String,
          enum: ["starter", "pro", "business"],
          default: "starter"
        },
        avatarURL: String,
        token: {
          type: String,
          default:null
        },
          verify: {
            type: Boolean,
            default: false,
          },
          verificationToken: {
            type: String,
          },
    }, {versionKey:false, timestamps:false});

userSchema.pre("findOneAndUpdate", handleUpdateValidate);

userSchema.post("save", handleSaveError);

userSchema.post("findOneAndUpdate", handleSaveError);

const User = model("user", userSchema);

export default User;