import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken";
import gravatar from 'gravatar';
import "dotenv/config";
import fs from 'fs/promises';
import path from 'path';
import { nanoid } from "nanoid";

import User from "../models/user.js";

import { HttpError, sendEmail } from "../helpers/index.js";

import { ctrlWrapper } from "../decorators/index.js";
import Jimp from 'jimp';

const {JWT_SECRET,BASE_URL} = process.env;

const register = async(req, res)=> {
    const {email, password} = req.body;
    const user = await User.findOne({email});
    if(user) {
        throw HttpError(409, "Email in use");
    }

    const hashPassword = await bcrypt.hash(password, 10);
    const verificationToken = nanoid();

    const newUser = await User.create({...req.body, password: hashPassword,avatarURL:gravatar.url(email),verificationToken});

    const verifyEmail = {
        to: email,
        subject: "Verify email",
        html: `<a href="${BASE_URL}/users/verify/${verificationToken}" target="_blank">Click verify email</a>`
    }

    await sendEmail(verifyEmail);

    res.status(201).json({
        user:{
            email: newUser.email,
            subscription: "starter",
            avatarURL:gravatar.profile_url(newUser.email)
        }
        })
}

const verify = async(req, res)=> {
    const {verificationToken} = req.params;
    const user = await User.findOne({verificationToken});
    if(!user) {
        throw HttpError(404, "User not found")
    }

    await User.findByIdAndUpdate(user._id, {verify: true, verificationToken: ""});

    res.json({
        message: "Verification successful"
    })
}
const resendVerifyEmail = async(req, res)=> {
    const {email} = req.body;
    const user = await User.findOne({email});
    if(!user) {
        throw HttpError(404, "User not found")
    }
    
    if(user.verify) {
        throw HttpError(400, "Verification has already been passed")
    }

    const verifyEmail = {
        to: email,
        subject: "Verify email",
        html: `<a href="${BASE_URL}/users/verify/${user.verificationToken}" target="_blank">Click verify email</a>`
    }

    await sendEmail(verifyEmail);

    res.json({
        message: "Verification email sent"
    })
}

const login = async(req, res)=> {
    const {email, password} = req.body;
    const user = await User.findOne({email});
    if(!user) {
        throw HttpError(401, "email or password is wrong");
    }
    if(!user.verify) {
        throw HttpError(401, "Email verification required");
    }

    const passwordCompare = bcrypt.compare(password, user.password);
    if(!passwordCompare) {
        throw HttpError(401, "email or password is wrong");
    }

    const payload = {
        id: user._id,
    }

    const token = jwt.sign(payload, JWT_SECRET, {expiresIn: "23h"});
    await User.findByIdAndUpdate(user._id, {token});

    res.json({
        token: token,
        user:{
            email: email,
            subscription: "starter",
        }
    })
}

const getCurrent = (req, res)=> {
    const {subscription, email} = req.user;

    res.json({
        email:email,
        subscription:subscription
    })
}

const logout = async(req, res) => {
    const {_id} = req.user;
    await User.findByIdAndUpdate(_id, {token: ""});
    
    res.status(204).json();
}
const avatarPath = path.resolve("public","avatars");

const updateAvatar = async(req,res)=>{
    const { path: oldPath,filename} = req.file;
    const outputPath = path.resolve("tmp",filename);
    try{
        const image = await Jimp.read(outputPath);
        image.resize(250, 250);
        await image.writeAsync(outputPath);
        req.file.path = outputPath;
    } catch(error){
        throw HttpError(400, `${error.message}`);
    }
    const newPath = path.join(avatarPath,filename);
    fs.rename(oldPath, newPath);
    const url = path.join("avatars",filename);
    const {_id} = req.user;
    const result = await User.findByIdAndUpdate(_id,{avatarURL:url},{new:true,});
    if(!result){
        throw HttpError(404,`Invalid id = ${_id}`);
    }
    res.status(200).json({
        avatarURL:url,
    });
}

export default {
    register: ctrlWrapper(register),
    verify: ctrlWrapper(verify),
    resendVerifyEmail: ctrlWrapper(resendVerifyEmail),
    login: ctrlWrapper(login),
    getCurrent: ctrlWrapper(getCurrent),
    logout: ctrlWrapper(logout),
    updateAvatar:ctrlWrapper(updateAvatar),
}