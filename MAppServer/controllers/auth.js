const User = require('../models/user')
const { validationResult } = require('express-validator/check')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')


exports.signUp = (req, res, next) => {
    const errors = validationResult(req)
    if(errors.isEmpty()) {
        const error = new Error('Validation failed')
        error.statusCode = 422
        error.data = errors.array()
        throw error
        return res.status(422).json({message: 'Validation failed, entered data is incorrect',
        errors: errors.array()})
    }
    const email = req.body.email
    const name = req.body.name
    const password = req.body.password
    bcrypt.hash(password, 12)
    .then(hashedPassword => {
        const user = new User({email: email, password: hashedPassword, name: name})
        return user.save()
    })
    .then(result => {
        res.status(201).json({message: 'User created', userId: result._id})
    })
    .catch(err => {
    if(!err.statusCode) {
      err.statusCode = 500
    }
    next(err)
  })
}

exports.login = (req, res, next) => {
  const email = req.body.email
  const password = req.body.password
  let loadedUser
  User.findOne({email: email})
  .then(user => {
    if(!user) {
      const error = new Error('User with the emailID not found')
      error.statusCode = 401
      throw error
    }
      loadedUser = user
      console.log('check',password, user.password)
      return bcrypt.compare(password, user.password)
  })
  .then(isEqual => {
    if(!isEqual) {
      const error = new Error('Wrong password!')
      error.statusCode = 401
      throw error
    }
    const token = jwt.sign({email: loadedUser.email, 
                            userId: loadedUser._id.toString()},
                            'some-secret-key',
                            {expiresIn: '2h'})
    return res.status(200).json({token: token, userId: loadedUser._id.toString()})
  })
  .catch(err => {
    if(!err.statusCode) {
      err.statusCode = 500
    }
    next(err)
  })
}