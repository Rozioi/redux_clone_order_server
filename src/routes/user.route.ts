import { FastifyInstance, FastifyReply, FastifyRequest, RouteGenericInterface } from "fastify";
import { userController } from "../controllers/user.controller";
import { TRouteFunction } from "../utils/fastify-route";
import { mongoClient } from "../app";
import { ObjectId } from "mongodb";
import { downloadFileFromGoogleDrive } from "../utils/diskToServer";
import path from "path";
import fs from "fs";
import {Throttle}  from "stream-throttle";

interface DownloadModBody extends RouteGenericInterface {
    Body: {
        url: string;
        modId: string;
    }
}

function convert(link: string): string {
  const match = link.match(/(?:\/d\/|\/file\/d\/)([a-zA-Z0-9_-]{10,})/);
  if (!match) return 'INVALID_LINK'; 
  const fileId = match[1]; 
  return `https://drive.google.com/uc?export=download&id=${fileId}`; 
}

export const UserRoutes: TRouteFunction = (fastify: FastifyInstance, _opts, done) => {
    fastify.get('/users/:id', { 
        preHandler: fastify.verifyJWT 
    }, userController.getUserById as any);
  fastify.get('/users/search/:identifier', {
    // preHandler: fastify.verifyJWT 
  }, userController.getUserByIdOrUsername as any);
    fastify.get('/users/stats/:id', { 
        // preHandler: fastify.verifyJWT 
    }, userController.getUserStatsById as any);
    fastify.get('/download/:file', async (req:FastifyRequest<{Params: {file:string}, Querystring: {speed?: string}}>, reply:FastifyReply) => {
        const file = req.params.file;
        const speed = parseInt(req.query.speed || '0');
        const filePath = path.join(__dirname, '..', 'utils', 'mods', file);
        
        if (!fs.existsSync(filePath)) {
            return reply.status(404).send('File not found');
        }

        // Конвертируем МБ/с в байты/с (1 МБ = 1024 * 1024 байт)
        const throttleRate = speed * 1024 * 1024;
        console.log(`Ограничение скорости: ${speed} МБ/с (${throttleRate} байт/с)`);

        const fileStream = fs.createReadStream(filePath);
        
        // Применяем ограничение скорости только если оно задано
        const throttleStream = throttleRate > 0 
            ? fileStream.pipe(new Throttle({ rate: throttleRate }))
            : fileStream;
        
        reply.header('content-type', 'application/zip');
        reply.header('content-disposition', `attachment; filename="${file}"`);
        
        // Добавляем обработку ошибок
        throttleStream.on('error', (error: Error) => {
            console.error('Ошибка при скачивании файла:', error);
            reply.status(500).send('Ошибка при скачивании файла');
        });

        return reply.send(throttleStream);
    });

    // Загрузка мода на сервер
    fastify.post<DownloadModBody>('/mods/download', {
        preHandler: fastify.verifyJWT
    }, async (req, reply) => {
        try {
            const { url, modId } = req.body;
            const driveLink = convert(url);
            
            if (driveLink === 'INVALID_LINK') {
                return reply.status(400).send({ error: 'Invalid Google Drive link' });
            }

            const fileName = `${modId}.zip`;
            await downloadFileFromGoogleDrive(driveLink);
            
            return reply.send({ 
                message: 'Mod downloaded successfully',
                fileName: fileName
            });
        } catch (error) {
            console.error('Error downloading mod:', error);
            return reply.status(500).send({ error: 'Failed to download mod' });
        }
    });

    fastify.get('/users', {
        // preHandler: fastify.verifyJWT,
        schema: {
            querystring: {
                type: 'object',
                properties: {
                    page: { type: 'string', pattern: '^\\d+$', default: '1' },
                    limit: { type: 'string', pattern: '^\\d+$', default: '10' }
                }
            }
        }
    }, async (req, reply) => {
        try {
            const page = parseInt((req.query as any).page) || 1;
            const limit = parseInt((req.query as any).limit) || 10;
            const result = await userController.getUsersPaginated(page, limit);
            return reply.send(result);
        } catch (error) {
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });
    
    fastify.get('/badge/:userId', async (req:FastifyRequest<{Params: {userId: string}}>,reply:FastifyReply) => {
      const id = req.params.userId;
      console.log(id);
      const result = await mongoClient.FindDocFieldsByFilter('badges', {userID: new ObjectId(id)});
      reply.status(200).send(result);
    })
    fastify.get('/badges', async (req:FastifyRequest, reply:FastifyReply) => {
      const result = await mongoClient.FindDocFieldsByFilter('badges', {});
      reply.status(200).send(result);
    })
    fastify.delete('/badge/:userId', async (req:FastifyRequest<{Params: {userId: string}}>,reply) => {
      const id = req.params.userId;
      console.log(id);
      const result = await mongoClient.DeleteDocument('badges', {userID: new ObjectId(id)});
      reply.status(200).send(result);
    })
    fastify.post('/auth/register', userController.createNewUser);

    fastify.put('/users/:id/status', { 
        preHandler: fastify.verifyJWT 
    }, userController.toggleAccountStatus as any);

    fastify.delete('/users/:id', { 
        // preHandler: fastify.verifyJWT 
    }, userController.deleteAccount as any);
  fastify.get('/users/p/:id', async (req: FastifyRequest<{Params: {id:string}}>, reply) => {
    
    const res = await mongoClient.FindDocFieldsByFilter('admins', {})
    return res;
    });
    fastify.post('/auth/login', userController.loginUser);
    fastify.post('/admin/verify', userController.verifyAdminLogin as any);

    fastify.get('/users/verify', { 
        preHandler: fastify.verifyJWT 
    }, userController.verifyToken);

    // Добавляем эндпоинт для получения настроек подписки
    fastify.get('/subscription/settings', async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            // Получаем настройки из базы данных
            const settings = await mongoClient.FindDocFieldsByFilter('subscription_settings', {});
            
            if (!settings || settings.length === 0) {
                // Если настроек нет, возвращаем дефолтные значения
                return reply.send({
                    downloadQuota: {
                        free: 0.5,    // 0.5 МБ/с
                        basic: 1,     // 1 МБ/с
                        medium: 5,    // 5 МБ/с
                        premium: 10   // 10 МБ/с
                    }
                });
            }

            return reply.send(settings[0]);
        } catch (error) {
            console.error('Error fetching subscription settings:', error);
            return reply.status(500).send({ error: 'Failed to fetch subscription settings' });
        }
    });

    done();
};