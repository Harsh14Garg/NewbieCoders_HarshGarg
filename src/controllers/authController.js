const catchAsync = require('../utils/catchAsync');
const AuthService = require('../services/AuthService');
const AppError = require('../utils/AppError');

exports.signup = catchAsync(async (req, res) => {
  const { name, email, password, role, interests } = req.body;

  const result = await AuthService.signup({
    name,
    email,
    password,
    role,
    interests,
  });

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: result,
  });
});

exports.login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  const result = await AuthService.login(email, password);

  res.json({
    success: true,
    message: 'Login successful',
    data: result,
  });
});

exports.getMe = catchAsync(async (req, res) => {
  const user = await AuthService.getUserById(req.userId);

  res.json({
    success: true,
    data: user,
  });
});

exports.updateProfile = catchAsync(async (req, res) => {
  const { name, bio, phone, interests, avatar, location } = req.body;

  const user = await AuthService.updateProfile(req.userId, {
    name,
    bio,
    phone,
    interests,
    avatar,
    location,
  });

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: user,
  });
});

exports.changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (newPassword !== confirmPassword) {
    throw new AppError('Passwords do not match', 400);
  }

  const result = await AuthService.changePassword(req.userId, currentPassword, newPassword);

  res.json({
    success: true,
    message: 'Password changed successfully',
    data: result,
  });
});
