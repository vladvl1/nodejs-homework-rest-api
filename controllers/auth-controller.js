import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken";
import gravatar from 'gravatar';
import "dotenv/config";
import fs from 'fs';
import path from 'path';

import User from "../models/user.js";

import { HttpError } from "../helpers/index.js";

import { ctrlWrapper } from "../decorators/index.js";
import Jimp from 'jimp';

const {JWT_SECRET} = process.env;

const register = async(req, res)=> {
    const {email, password} = req.body;
    const user = await User.findOne({email});
    if(user) {
        throw HttpError(409, "Email in use");
    }

    const hashPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({...req.body, password: hashPassword,avatarURL:gravatar.url(email)});

    res.status(201).json({
        user:{
            email: newUser.email,
            subscription: "starter",
            avatarURL:gravatar.profile_url(newUser.email)
        }
        })
}

const login = async(req, res)=> {
    const {email, password} = req.body;
    const user = await User.findOne({email});
    if(!user) {
        throw HttpError(401, "email or password is wrong");
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
const avatarPath = path.resolve("public","avatar");

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
    res.json(result);
}

export default {
    register: ctrlWrapper(register),
    login: ctrlWrapper(login),
    getCurrent: ctrlWrapper(getCurrent),
    logout: ctrlWrapper(logout),
    updateAvatar:ctrlWrapper(updateAvatar),
}