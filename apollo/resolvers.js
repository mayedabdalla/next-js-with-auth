import { AuthenticationError, UserInputError } from 'apollo-server-micro'
import { createUser, findUser, validatePassword } from '../lib/user'
import { setLoginSession, getLoginSession } from '../lib/auth'
import { removeTokenCookie } from '../lib/auth-cookies'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export const resolvers = {
  Query: {
    async viewer(_parent, _args, context, _info) {
      try {
        const session = await getLoginSession(context.req)
        if (session) {
          return prisma.user.findOne({
            where: {
              username: session.username
            }
          })
        }
      } catch (error) {
        throw new AuthenticationError(
          'Authentication token is invalid, please log in'
        )
      }
    },
  },
  Mutation: {
    async signUp(_parent, args, _context, _info) {
      const user = await prisma.user.create({
        data: args.input
      });
      return { user }
    },
    async signIn(_parent, args, context, _info) {
      // const user = await findUser({ email: args.input.email })
      const user = await prisma.user.findOne({
        where: {username: args.input.username}
      })
      // if (user && (await validatePassword(user, args.input.password))) {
      if (user && (user.password === args.input.password)) {
        const session = {
          id: user.id,
          username: user.username,
        }

        await setLoginSession(context.res, session)

        return { user }
      }

      throw new UserInputError('Invalid email and password combination')
    },
    async signOut(_parent, _args, context, _info) {
      removeTokenCookie(context.res)
      return true
    },
  },
}
