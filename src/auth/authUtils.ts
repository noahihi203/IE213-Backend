import JWT, { JwtPayload, Secret } from "jsonwebtoken";
import asyncHandler from "../helpers/asyncHandler.js";
import { AuthFailureError, NotFoundError } from "../core/error.response.js";

//service
import KeyTokenService from "../services/keyToken.service.js";

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
