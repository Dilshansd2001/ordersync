const bcrypt = require('bcryptjs')
const User = require('../models/User')

const ensureSuperAdmin = async ({ name, email, password }) => {
  if (!email || !password) {
    return
  }

  const normalizedEmail = email.trim().toLowerCase()
  const existingUser = await User.findOne({ email: normalizedEmail })

  if (existingUser) {
    if (
      existingUser.role !== 'SUPER_ADMIN' ||
      existingUser.status !== 'active' ||
      existingUser.name !== name
    ) {
      existingUser.role = 'SUPER_ADMIN'
      existingUser.status = 'active'
      existingUser.name = name
      await existingUser.save()
    }

    const passwordMatches = await bcrypt.compare(password, existingUser.password)

    if (!passwordMatches) {
      existingUser.password = password
      await existingUser.save()
    }

    return
  }

  await User.create({
    name,
    email: normalizedEmail,
    password,
    role: 'SUPER_ADMIN',
    status: 'active',
  })

  console.log(`Bootstrapped super admin account for ${normalizedEmail}`)
}

module.exports = {
  ensureSuperAdmin,
}
