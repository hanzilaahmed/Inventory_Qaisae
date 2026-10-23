import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma/client.js';
import { config } from '../config/env.js';

export class AuthService {
  static async login(email, password) {
    if (!email || !password) {
      const error = new Error('Email and password are required');
      error.statusCode = 400;
      throw error;
    }

    const admin = await prisma.admin.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!admin) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, name: admin.name },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    return {
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
      },
      token,
    };
  }

  static async getProfile(adminId) {
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: { id: true, name: true, email: true, createdAt: true },
    });
    if (!admin) {
      const error = new Error('Admin not found');
      error.statusCode = 404;
      throw error;
    }
    return admin;
  }

  static async updateProfile(adminId, { name, email, currentPassword, newPassword }) {
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
    });
    if (!admin) {
      const error = new Error('Admin not found');
      error.statusCode = 404;
      throw error;
    }

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (email) updateData.email = email.toLowerCase().trim();

    if (newPassword) {
      if (!currentPassword) {
        const error = new Error('Current password is required to change password');
        error.statusCode = 400;
        throw error;
      }
      const isMatch = await bcrypt.compare(currentPassword, admin.password);
      if (!isMatch) {
        const error = new Error('Current password does not match');
        error.statusCode = 400;
        throw error;
      }
      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    const updated = await prisma.admin.update({
      where: { id: adminId },
      data: updateData,
      select: { id: true, name: true, email: true, updatedAt: true },
    });
    return updated;
  }

  static async ensureDefaultAdmin() {
    const count = await prisma.admin.count();
    if (count === 0) {
      const hashedPassword = await bcrypt.hash(config.admin.password, 10);
      const created = await prisma.admin.create({
        data: {
          name: config.admin.name,
          email: config.admin.email.toLowerCase().trim(),
          password: hashedPassword,
        },
      });
      console.log(`[Seed] Default Admin created: ${created.email} / ${config.admin.password}`);
      return created;
    }
  }
}
