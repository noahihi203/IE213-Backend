"use strict";
import _ from "lodash";
import { Types } from "mongoose";

const convertToObjectIdMongodb = (id: string) => new Types.ObjectId(id);
const getInfoData = ({ fields = [], object = {} }) => {
  return _.pick(object, fields);
};

// ['a', 'b'] => {a: 1, b: 1}
const getSelectData = (select = []) => {
  return Object.fromEntries(select.map((el) => [el, 1]));
};

// ['a', 'b'] => {a: 0, b: 0}
const unGetSelectData = (select = []) => {
  return Object.fromEntries(select.map((el) => [el, 0]));
};

const removeUndefinedNullObject = (obj: { [x: string]: any }) => {
  Object.keys(obj).forEach((k) => {
    if (obj[k] === null) {
      delete obj[k];
    }
  });
  return obj;
};

const updateNestedObjectParser = (obj: { [x: string]: any }) => {
  const final: { [x: string]: any } = {};
  Object.keys(obj).forEach((k) => {
    if (typeof obj[k] === "object" && !Array.isArray(obj[k])) {
      const response = updateNestedObjectParser(obj[k]);
      Object.keys(response).forEach((a) => {
        final[`${k}.${a}`] = response[a];
      });
    } else {
      final[k] = obj[k];
    }
  });
  return final;
};

export {
  getInfoData,
  getSelectData,
  unGetSelectData,
  removeUndefinedNullObject,
  convertToObjectIdMongodb,
};
