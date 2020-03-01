const { validationResult } = require('express-validator/check')
const Post = require('../models/post')
const User = require('../models/user')
const isAuth = require('../middleware/isAuth')

const fs = require('fs')
const path = require('path')

exports.getPosts = (req, res, next) => {
  const currentPage = req.query.page || 1
  const POSTS_PER_PAGE = 2
  let totalItems
  Post.find().countDocuments()
  .then(count => {
    totalItems = count
    return Post.find()
    .skip((currentPage - 1) * POSTS_PER_PAGE)
    .limit(POSTS_PER_PAGE)
  })
  .then(posts => { 
      res.status(200).json({message: 'Posts fetched successfully', posts: posts, totalItems: totalItems})
    })
  .catch(err => {
    if(!err.statusCode) {
      err.statusCode = 500
    }
    next(err)
  })
}

exports.createPost = (req, res, next) => {
  let creator
  const errors = validationResult(req)
  if(!errors.isEmpty()) {
    return res.status(422).json({message: 'Validation failed, entered data is incorrect',
    errors: errors.array()})
  }
  image = req.file
  if(!image) {
    const error = new Error('No image provided')
    error.statusCode = 422
    throw error
  }
  var imageUrl = image.path

  imageUrl = imageUrl.substring(imageUrl.search('images'),imageUrl.length)
  imageUrl = imageUrl.replace("\\" ,"/")

  const title = req.body.title;
  const content = req.body.content;
  const post = new Post({
        title: title,
        content: content,
        imageUrl: imageUrl,
        creator: req.userId
      })
  post.save()
  .then(result => {
    return User.findById(req.userId)
  })
  .then(user => {
    user.posts.push(post)
    creator = user
    return user.save()
  })
  .then(result => {
    res.status(201).json({
    message: 'Post created successfully!',
    post: post,
    creator: {_id: creator._id, name: creator.name}
  })
  })
  .catch()
  // Create post in db
  
}

exports.getPost = (req, res, next) => {
  const postId = req.params.postId
  Post.findById(postId)
  .then(post => {
    if(!post) {
      const error = new Error('Couldnt find the post')
      error.statusCode = 404
      throw error
    }
    return res.status(200).json({message: 'Post fetched successfully', post: post})
  })
  .catch(err => {
    if(!err.statusCode) {
      err.statusCode = 500
    }
    next(err)
  })
}

exports.updatePost = (req, res, next) => {
  const postId = req.params.postId
  const title = req.body.title
  const content = req.body.content
  image = req.file
  const errors = validationResult(req)
  if(!errors.isEmpty()) {
    return res.status(422).json({message: 'Validation failed, entered data is incorrect',
    errors: errors.array()})
  }
  if(image)
  {
    var imageUrl = image.path
    imageUrl = imageUrl.substring(imageUrl.search('images'),imageUrl.length)
    imageUrl = imageUrl.replace("\\" ,"/")
  }
  Post.findById(postId).
  then(post => {
    if (post.creator.toString() !== req.userId.toString()) {
      error = new Error('Unauthroized access')
      error.statusCode = 403
      throw error
    }
    post.title = title
    post.content = content
    if(image) {
      var imageUrl = image.path
      imageUrl = imageUrl.substring(imageUrl.search('images'),imageUrl.length)
      imageUrl = imageUrl.replace("\\" ,"/")
      post.imageUrl = imageUrl
    }
    return post.save()
  })
  .then( result => {
    res.status(200).json({message:'Post updated successfully', post: result})
  })
  .catch(err => {
    if(!err.statusCode) {
      err.statusCode = 500
    }
    next(err)
  })
}

exports.deletePost = (req, res, next) => {
  postId = req.params.postId
  Post.findById(postId)
  .then(post => {
      if(!post) {
        const error = new Error('Couldnt find the post')
        error.statusCode = 404
        throw error
    }
    if (post.creator.toString() !== req.userId.toString()) {
      error = new Error('Unauthroized access')
      error.statusCode = 403
      throw error
    }
    clearImage(post.imageUrl)
    return Post.findByIdAndRemove(postId)
  })
  .then(result => {
    User.findById(req.userId)
  })
  .then(user => {
    user.posts.pull(postId)
    user.save()
  })
  .then(result => {
    res.status(200).json({message: 'Post removed sucessfully'})
  })
  .catch(err => {
    if(!err.statusCode) {
      err.statusCode = 500
    }
    next(err)
  })
}

const clearImage = filePath => {
  filePath = path.join(__dirname, '..', filePath)
  fs.unlink(filePath, err => console.log(err))
}
