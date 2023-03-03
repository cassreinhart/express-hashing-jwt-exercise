const express = require("express")
const router = new express.Router();
const ExpressError = require("../expressError")
const db = require('../db');
const User = require("../models/user");
// const bcrypt = require('bcrypt')
// const { BCRYPT_WORK_FACTOR, SECRET_KEY } = require("../config");
const { SECRET_KEY } = require("../config");
// const jwt = require('jsonwebtoken')
const {ensureLoggedIn, ensureCorrectUser} = require('../middleware/auth')

/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/

router.post('/login', async (req, res, next) => {
    try {
        let {username, password} = req.body;
        if (await User.authenticate(username, password)) {
            let token = jwt.sign({username}, SECRET_KEY)
            User.updateLoginTimestamp(username)
            return res.json({token})
        } else {
            throw new ExpressError("Invalid credentials.", 400)
        }
    } catch (err) {
        return next(err)
    }
})

/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */

router.post('/register', async (req, res, next) => {
    try {
        let {username} = await User.register(req.body)
        let token = jwt.sign({username}, SECRET_KEY)
        User.updateLoginTimestamp(username)
        return res.json({token})
    } catch (err) {
        return next(err)
    }
})