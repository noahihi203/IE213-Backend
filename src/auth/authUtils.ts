import JWT, { JwtPayload, Secret } from "jsonwebtoken";
import asyncHandler from "../helpers/asyncHandler.js";
import { AuthFailureError, NotFoundError } from "../core/error.response.js";

//service
import KeyTokenService from "../services/keyToken.service.js";
import { userModel } from "../models/user.model.js";

const HEADER = {
  API_KEY: "x-api-key",
  CLIENT_ID: "x-client-id",
  AUTHORIZATION: "authorization",
  REFRESHTOKEN: "x-rtoken-id",
};

const createTokenPair = async (
  payLoad: JwtPayload,
  publicKey: Secret,
  privateKey: Secret,
): Promise<{ accessToken: string; refreshToken: string }> => {
  try {
    const accessToken = JWT.sign(payLoad, privateKey, {
      algorithm: "RS256",
      expiresIn: "2 days",
    });

    const refreshToken = JWT.sign(payLoad, privateKey, {
      algorithm: "RS256",
      expiresIn: "7 days",
    });
    JWT.verify(
      accessToken,
      publicKey,
      { algorithms: ["RS256"] },
      (err, decode) => {
        if (err) {
          console.error(`error verify::`, err);
        } else {
          console.log(`decode verify::`, decode);
        }
      },
    );

    return { accessToken, refreshToken };
  } catch (e) {
    throw e;
  }
};

/**
 * Check if token version matches current user's token version
 * If mismatch, throw specific error for frontend to handle auto-refresh
 */
const checkTokenVersion = async (decodedToken: JwtPayload) => {
  const user = await userModel
    .findById(decodedToken.userId)
    .select("tokenVersion isActive")
    .lean();

  if (!user) {
    throw new AuthFailureError("User not found");
  }

  if (!user.isActive) {
    throw new AuthFailureError("User account is inactive");
  }

  const tokenVersionInToken = decodedToken.tokenVersion || 0;
  const tokenVersionInDB = user.tokenVersion || 0;

  if (tokenVersionInToken < tokenVersionInDB) {
    // Special error code for frontend to trigger auto-refresh
    const error = new AuthFailureError("Token version outdated");
    (error as any).code = "TOKEN_OUTDATED"; // Custom error code
    throw error;
  }
};

const authentication = asyncHandler(async (req, res, next) => {
  const userId = req.headers[HEADER.CLIENT_ID];
  if (!userId) throw new AuthFailureError("Invalid Request");

  const keyStore = await KeyTokenService.findByUserId(userId);
  if (!keyStore) throw new NotFoundError("Not found keyStore");

  const refreshToken = req.headers[HEADER.REFRESHTOKEN];

  if (refreshToken) {
    try {
      const decodeUser = JWT.verify(refreshToken, keyStore.publicKey, {
        algorithms: ["RS256"],
      }) as JwtPayload;
      if (userId !== decodeUser.userId)
        throw new AuthFailureError("Invalid Userid");
      
      // Check token version
      await checkTokenVersion(decodeUser);
      
      req.keyStore = keyStore;
      req.user = decodeUser;
      req.refreshToken = refreshToken;
      return next();
    } catch (error) {
      throw error;
    }
  }

  // Nếu không có refresh token, kiểm tra access token
  const accessToken = req.headers[HEADER.AUTHORIZATION];
  if (!accessToken) throw new AuthFailureError("Invalid Request");

  try {
    const decodeUser = JWT.verify(accessToken, keyStore.publicKey, {
      algorithms: ["RS256"],
    }) as JwtPayload;
    if (userId !== decodeUser.userId)
      throw new AuthFailureError("Invalid Userid");
    
    // Check token version
    await checkTokenVersion(decodeUser);
    
    req.keyStore = keyStore;
    req.user = decodeUser;
    return next();
  } catch (error) {
    throw error; 
  }
});

const verifyJWT = async (token: string, keySecret: Secret) => {
  return JWT.verify(token, keySecret, { algorithms: ["RS256"] });
};

export { createTokenPair, authentication, verifyJWT };
