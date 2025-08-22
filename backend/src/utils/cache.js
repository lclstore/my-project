/**
 * 缓存工具类
 * 提供内存缓存和Redis缓存的统一接口
 */

class CacheManager {
  constructor(options = {}) {
    this.defaultTTL = options.ttl || 3600; // 默认1小时
    this.prefix = options.prefix || 'cache:';
    this.memoryCache = new Map();
    this.redis = null; // Redis实例，如果需要的话

    // 内存缓存定期清理
    this.startMemoryCleanup();
  }

  /**
   * 启动内存缓存清理任务
   */
  startMemoryCleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, { expiry }] of this.memoryCache) {
        if (expiry && expiry <= now) {
          this.memoryCache.delete(key);
        }
      }
    }, 60000); // 每分钟清理一次
  }

  /**
   * 生成缓存键
   */
  key(key) {
    return `${this.prefix}${key}`;
  }

  /**
   * 设置缓存
   */
  async set(key, value, ttl = null) {
    const cacheKey = this.key(key);
    const expiry = ttl ? Date.now() + (ttl * 1000) : null;

    try {
      // 如果有Redis，优先使用Redis
      if (this.redis) {
        const serialized = JSON.stringify(value);
        if (ttl) {
          await this.redis.setex(cacheKey, ttl, serialized);
        } else {
          await this.redis.set(cacheKey, serialized);
        }
      } else {
        // 使用内存缓存
        this.memoryCache.set(cacheKey, {
          value,
          expiry
        });
      }
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * 获取缓存
   */
  async get(key) {
    const cacheKey = this.key(key);

    try {
      // 如果有Redis，优先使用Redis
      if (this.redis) {
        const result = await this.redis.get(cacheKey);
        return result ? JSON.parse(result) : null;
      } else {
        // 使用内存缓存
        const cached = this.memoryCache.get(cacheKey);
        if (!cached) {return null;}

        // 检查是否过期
        if (cached.expiry && cached.expiry <= Date.now()) {
          this.memoryCache.delete(cacheKey);
          return null;
        }

        return cached.value;
      }
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * 删除缓存
   */
  async del(key) {
    const cacheKey = this.key(key);

    try {
      if (this.redis) {
        await this.redis.del(cacheKey);
      } else {
        this.memoryCache.delete(cacheKey);
      }
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * 检查缓存是否存在
   */
  async has(key) {
    const value = await this.get(key);
    return value !== null;
  }

  /**
   * 清空缓存
   */
  async clear(pattern = null) {
    try {
      if (this.redis) {
        if (pattern) {
          const keys = await this.redis.keys(`${this.prefix}${pattern}`);
          if (keys.length > 0) {
            await this.redis.del(...keys);
          }
        } else {
          const keys = await this.redis.keys(`${this.prefix}*`);
          if (keys.length > 0) {
            await this.redis.del(...keys);
          }
        }
      } else {
        if (pattern) {
          const regex = new RegExp(`^${this.prefix}${pattern.replace(/\*/g, '.*')}$`);
          for (const key of this.memoryCache.keys()) {
            if (regex.test(key)) {
              this.memoryCache.delete(key);
            }
          }
        } else {
          this.memoryCache.clear();
        }
      }
      return true;
    } catch (error) {
      console.error('Cache clear error:', error);
      return false;
    }
  }

  /**
   * 获取或设置缓存（缓存穿透保护）
   */
  async getOrSet(key, getter, ttl = null) {
    try {
      // 先尝试获取缓存
      let value = await this.get(key);
      if (value !== null) {
        return value;
      }

      // 缓存不存在，执行getter获取数据
      if (typeof getter === 'function') {
        value = await getter();

        // 将结果存入缓存
        if (value !== null && value !== undefined) {
          await this.set(key, value, ttl || this.defaultTTL);
        }

        return value;
      }

      return null;
    } catch (error) {
      console.error('Cache getOrSet error:', error);
      return null;
    }
  }

  /**
   * 批量获取缓存
   */
  async mget(keys) {
    const results = {};

    try {
      if (this.redis) {
        const cacheKeys = keys.map(key => this.key(key));
        const values = await this.redis.mget(...cacheKeys);

        keys.forEach((key, index) => {
          results[key] = values[index] ? JSON.parse(values[index]) : null;
        });
      } else {
        for (const key of keys) {
          results[key] = await this.get(key);
        }
      }
    } catch (error) {
      console.error('Cache mget error:', error);
      // 返回空结果
      keys.forEach(key => {
        results[key] = null;
      });
    }

    return results;
  }

  /**
   * 批量设置缓存
   */
  async mset(data, ttl = null) {
    try {
      if (this.redis) {
        const pipeline = this.redis.pipeline();

        for (const [key, value] of Object.entries(data)) {
          const cacheKey = this.key(key);
          const serialized = JSON.stringify(value);

          if (ttl) {
            pipeline.setex(cacheKey, ttl, serialized);
          } else {
            pipeline.set(cacheKey, serialized);
          }
        }

        await pipeline.exec();
      } else {
        for (const [key, value] of Object.entries(data)) {
          await this.set(key, value, ttl);
        }
      }
      return true;
    } catch (error) {
      console.error('Cache mset error:', error);
      return false;
    }
  }

  /**
   * 增加数值
   */
  async incr(key, amount = 1, ttl = null) {
    try {
      if (this.redis) {
        const cacheKey = this.key(key);
        const result = await this.redis.incrby(cacheKey, amount);

        if (ttl) {
          await this.redis.expire(cacheKey, ttl);
        }

        return result;
      } else {
        const current = await this.get(key) || 0;
        const newValue = Number(current) + amount;
        await this.set(key, newValue, ttl);
        return newValue;
      }
    } catch (error) {
      console.error('Cache incr error:', error);
      return null;
    }
  }

  /**
   * 设置过期时间
   */
  async expire(key, ttl) {
    try {
      if (this.redis) {
        const cacheKey = this.key(key);
        await this.redis.expire(cacheKey, ttl);
        return true;
      } else {
        const cached = this.memoryCache.get(this.key(key));
        if (cached) {
          cached.expiry = Date.now() + (ttl * 1000);
          return true;
        }
        return false;
      }
    } catch (error) {
      console.error('Cache expire error:', error);
      return false;
    }
  }
}

// 创建默认实例
const cache = new CacheManager();

module.exports = { CacheManager, cache };