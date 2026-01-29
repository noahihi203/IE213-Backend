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
    const accessToken = JWT.sign(payLoad, publicKey, {
      expiresIn: "2 days",
    });

    const refreshToken = JWT.sign(payLoad, privateKey, {
      expiresIn: "7 days",
    });
    JWT.verify(accessToken, publicKey, (err, decode) => {
      if (err) {
        console.error(`error verify::`, err);
      } else {
        console.log(`decode verify::`, decode);
      }
    });

    return { accessToken, refreshToken };
  } catch (e) {
    throw e;
  }
};

const authenticationV2 = asyncHandler(async (req, res, next) => {
  const userId = req.headers[HEADER.CLIENT_ID];
  if (!userId) throw new AuthFailureError("Invalid Request");
  const keyStore = await KeyTokenService.findByUserId(userId);
  if (!keyStore) throw new NotFoundError("Not found keyStore");
  req.headers[HEADER.REFRESHTOKEN] = keyStore.refreshToken;

  console.log(
    `Noah check req.headers[HEADER.REFRESHTOKEN]: ${
      req.headers[HEADER.REFRESHTOKEN]
    }`,
  );
  console.log(`Noah check keyStore: ${keyStore}`);

  if (req.headers[HEADER.REFRESHTOKEN]) {
    try {
      const refreshToken = req.headers[HEADER.REFRESHTOKEN];
      const decodeUser = JWT.verify(refreshToken, keyStore.privateKey) as JwtPayload;
      console.log(`Noah check decodeUser: ${decodeUser}`);
      if (userId !== decodeUser.userId)
        throw new AuthFailureError("Invalid Userid");
      req.keyStore = keyStore;
      req.user = decodeUser;
      req.refreshToken = keyStore;
      return next();
    } catch (error) {
      throw error;
    }
  }
  const accessToken = req.headers[HEADER.AUTHORIZATION];
  if (!accessToken) throw new AuthFailureError("Invalid Request");

  try {
    const decodeUser = JWT.verify(accessToken, keyStore.publicKey) as JwtPayload;
    if (userId !== decodeUser.userId)
      throw new AuthFailureError("Invalid Userid");
    req.keyStore = keyStore;
    return next();
  } catch (error) {
    throw error;
  }
});

const verifyJWT = async (token: string, keySecret: Secret) => {
  return JWT.verify(token, keySecret);
};

export { createTokenPair, authenticationV2, verifyJWT };
