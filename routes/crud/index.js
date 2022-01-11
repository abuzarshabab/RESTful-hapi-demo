'use strict';

const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi)


const { db, connect, close } = require('../../Database/connection');
const tableName = 'users';
const mongo = require('mongodb');

const userSchema = Joi.object({
    name: Joi.string().min(3).max(30).required().label('Please enter name correctly'),
    email: Joi.string().min(6).max(50).required().label('Please enter email correctly'),
    gender: Joi.string().min(4).max(6).required().label('Something Wrong with Gender'),
    mobile: Joi.string().min(6).max(100).required().label('Something wrong with mobile number'),
})

const userPatchSchema = Joi.object({
    name: Joi.string().min(3).max(30).label('Please enter name correctly'),
    email: Joi.string().min(6).max(50).label('Please enter email correctly'),
    gender: Joi.string().min(4).max(6).label('Something Wrong with Gender'),
    mobile: Joi.string().min(6).max(100).label('Something wrong with mobile number'),
    userId: Joi.objectId(),
})

const userPutSchema = Joi.object({
    name: Joi.string().min(3).max(30).required().label('Please enter name correctly'),
    email: Joi.string().min(6).max(50).required().label('Please enter email correctly'),
    gender: Joi.string().min(4).max(6).required().label('Something Wrong with Gender'),
    mobile: Joi.string().min(6).max(100).required().label('Something wrong with mobile number'),
    userId: Joi.objectId(),
});

const userIdSchema = Joi.object({ userId: Joi.objectId() })

exports.plugin = {
    pkg: require('../../package.json'),

    register: async function (server, options) {

        // Create a route for example
        server.route({
            method: 'GET',
            path: '/',
            handler: async (request, h) => {
                const user = await db().collection(tableName).find({}).toArray();
                return { ...user };
            }
        })

        // Get single user info 
        server.route({
            method: 'GET',
            path: '/{userId}',
            handler: async (request, h) => {
                const userId = new mongo.ObjectId(request.params.userId);
                console.log(userId)
                const user = await db().collection(tableName).findOne(userId);
                return user ? user : `User Not Found`;
            }
        })

        server.route({
            method: 'POST',
            path: '/',
            options: {
                validate: {
                    payload: userSchema,
                },
                response: {
                    schema: Joi.array().items(userSchema),
                    failAction: 'log'
                }
            },
            handler: async (request, h) => {
                const user = await db().collection(tableName).insertOne(request.payload);
                return user;
            },
        });

        // Put is method is on going
        server.route({
            method: 'PUT',
            path: '/',
            // options: {
            //     validate: {
            //         payload: userPutSchema,
            //     }
            // },
            handler: (request, h) => {
                const userId = new mongo.ObjectId(request.payload.userId);
                const updatePacket = {
                    name: request.payload.name,
                    email: request.payload.email,
                    gender: request.payload.gender,
                    mobile: request.payload.mobile,
                }

                console.log(updatePacket, userId)
                const data = db().collection(tableName)
                    .updateOne({ _id: userId }, { $set: updatePacket })
                return data;
            }
        })

        // Patch method have some bugs
        server.route({
            method: 'PATCH',
            path: '/{userId}',
            options: {
                validate: {
                    payload: userPatchSchema,
                    params: userIdSchema,
                }
            },
            handler: async (request, h) => {
                const userId = new mongo.ObjectId(request.params.userId);
                const updatePacket = request.payload;
                let user = null;

                user = await db().collection(tableName)
                    .findOneAndUpdate(
                        {
                            _id: userId,
                        },
                        {
                            $set: updatePacket,
                        },
                    );
                const updateStatus = user.ok ? "Update Success" : "Update Failed";
                return { msg: updateStatus, user, updatePacket };
            }
        });

        // Delete is Done
        server.route({
            method: 'DELETE',
            path: '/{userId}',
            handler: async (request, h) => {
                const userId = new mongo.ObjectId(request.params.userId);
                const user = await db().collection(tableName).deleteOne({ _id: userId });
                return user.deletedCount ? user : 'User not found';
            }
        })

    }
};
