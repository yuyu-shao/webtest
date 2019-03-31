const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const app = new Koa();
const router = new Router();

app.use(bodyParser());

const users = {};

const atob = str => Buffer.from(str, 'base64').toString('ascii');
const decodeAuth = str => atob(str.split(" ")[1]);
const isAlphaNumeric = input_string => input_string.match(/^[0-9a-zA-Z]+$/);
const isAscii = input_string => input_string.split().every(c => c.charCodeAt(0) >= 33 && c.charCodeAt(0) <= 126);

router.post('/signup', ctx => {
    const body = ctx.request.body;
    const user_id = body.user_id;
    const password = body.password;

    if (!user_id || !password) {
        ctx.status = 400;
        ctx.body = {
            message: 'Account creation failed',
            cause: 'required user_id and password'
        };
        return;
    }

    if (user_id.length < 6 || user_id.length > 20) {
        ctx.status = 400;
        ctx.body = {
            message: 'Account creation failed',
            cause: 'user_id is too short or too long'
        };
        return;
    }

    if (password.length < 8 || user_id.length > 20) {
        ctx.status = 400;
        ctx.body = {
            message: 'Account creation failed',
            cause: 'password is too short or too long'
        };
        return;
    }

    if (!isAlphaNumeric(user_id)) {
        ctx.status = 400;
        ctx.body = {
            message: 'Account creation failed',
            cause: 'user_id pattern is wrong'
        };
        return;
    }

    if (!isAscii(password)) {
        ctx.status = 400;
        ctx.body = {
            message: 'Account creation failed',
            cause: 'password pattern is wrong'
        };
        return;
    }

    if (users[user_id]) {
        ctx.status = 400;
        ctx.body = {
            message: 'Account creation failed',
            cause: 'already same user_id is used'
        };
        return;
    }

    const user = { user_id, password };
    users[user_id] = user;

    ctx.status = 200;
    ctx.body = {
        message: 'Account successfully created',
        user
    };
});

router.get('/users/:user_id', ctx => {
    const authorization = ctx.request.header.authorization;
    if (!authorization) {
        ctx.status = 401;
        ctx.body = {
            message: 'Authentication Faild'
        };
        return;
    }

    const auth = decodeAuth(authorization);
    const auths =  auth.split(':');
    const password = auths[1];
    const user_id = auths[0];
    const get_user_id = ctx.params.user_id;

    if (!user_id || !users[user_id] || !get_user_id) {
        console.log(auth);
        console.log(ctx.params);
        console.log(users);
        ctx.status = 404;
        ctx.body = {
            message: 'No user found'
        };
        return;
    }

    if (users[user_id].password !== password) {
        ctx.status = 401;
        ctx.body = {
            message: 'Authentication Faild'
        };
        return;
    }

    ctx.status = 200;
    const userInfo = { ...users[get_user_id] };
    delete userInfo['password'];
    ctx.body = {
        message: 'User details by user_id',
        user: userInfo
    };
});

router.patch('/users/:user_id', ctx => {
    const authorization = ctx.request.header.authorization;
    if (!authorization) {
        ctx.status = 401;
        ctx.body = {
            message: 'Authentication Faild'
        };
        return;
    }

    const auth = decodeAuth(authorization);
    console.log(authorization);
    console.log(auth);
    const [ user_id, password ] = auth.split(':');

    if (user_id !== ctx.params.user_id) {
        ctx.status = 403;
        ctx.body = {
            message: 'No Permission for Update'
        };
        return;
    }

    if (!users[user_id]) {
        ctx.status = 404;
        ctx.body = {
            message: 'No user found'
        };
        return;
    }

    if (users[user_id].password !== password) {
        ctx.status = 401;
        ctx.body = {
            message: 'Authentication Faild'
        };
        return;
    }

    const body = ctx.request.body;
    if (body.user_id || body.password) {
        ctx.status = 400;
        ctx.body = {
            message: 'User updation failed',
            cause: 'not updatable user_id and password'
        };
        return;
    }

    const { nickname, comment } = body;
    if (!nickname && !comment) {
        ctx.status = 400;
        ctx.body = {
            message: 'User updation failed',
            cause: 'required nickname or comment'
        };
        return;
    }

    const recipt = {};
    if (nickname) {
        users[user_id].nickname = nickname;
        recipt.nickname = nickname;
    }
    if (comment) {
        users[user_id].comment = comment;
        recipt.comment = comment;
    }

    ctx.status = 200;
    ctx.body = {
        message: 'User successfully updated',
        recipt
    };
});

router.post('/close', ctx => {
    const authorization = ctx.request.header.authorization;
    if (!authorization) {
        ctx.status = 401;
        ctx.body = {
            message: 'Authentication Faild'
        };
        return;
    }

    const auth = decodeAuth(authorization);
    const [ user_id, password ] = auth.split(':');

    if (!users[user_id] || users[user_id].password !== password) {
        ctx.status = 401;
        ctx.body = {
            message: 'Authentication Faild'
        };
        };
        return;
    }

    ctx.status = 200;
    delete users[user_id];
    ctx.body = {
        message: 'Account and user successfully removed'
    };
});


app
    .use(router.routes())
    .use(router.allowedMethods());

app.listen(3000);