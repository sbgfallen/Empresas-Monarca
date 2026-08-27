/**
 * Vercel Serverless Catch-All for /api/*
 * Routes all /api/* requests through the Express app
 */
const handler = require("./index");

module.exports = handler;
