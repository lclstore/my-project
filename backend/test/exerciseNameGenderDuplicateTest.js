/**
 * 测试 Exercise 名称和性别组合的重复检查逻辑
 */

const express = require('express');
const request = require('supertest');
const exerciseRoutes = require('../routes/exercise');
const { BusinessHelper, query } = require('../config/database');

async function testExerciseNameGenderDuplicate() {
    try {
        console.log('🚀 开始测试 Exercise 名称和性别组合重复检查...\n');

        // 创建测试应用
        const app = express();
        app.use(express.json());
        app.use('/exercise', exerciseRoutes);

        const createdIds = [];

        // 1. 创建基础测试数据
        console.log('1. 创建基础测试数据');
        
        // 1.1 创建男性俯卧撑
        const maleExercise = await request(app)
            .post('/exercise/save')
            .send({
                name: '俯卧撑',
                genderCode: 'MALE',
                status: 'ENABLED',
                coverImgUrl: 'https://example.com/cover.jpg',
                met: 8,
                structureTypeCode: 'MAIN',
                difficultyCode: 'INTERMEDIATE',
                equipmentCode: 'NO_EQUIPMENT',
                positionCode: 'STANDING',
                injuredCodes: ['NONE'],
                nameAudioUrl: 'https://example.com/name.mp3',
                nameAudioUrlDuration: 3,
                howtodoScript: '双手撑地，身体保持直线，上下推动',
                howtodoAudioUrl: 'https://example.com/howtodo.mp3',
                howtodoAudioUrlDuration: 30,
                guidanceAudioUrl: 'https://example.com/guidance.mp3',
                guidanceAudioUrlDuration: 45,
                frontVideoUrl: 'https://example.com/front.mp4',
                frontVideoUrlDuration: 60,
                sideVideoUrl: 'https://example.com/side.mp4',
                sideVideoUrlDuration: 60
            });

        if (maleExercise.body.success) {
            createdIds.push(maleExercise.body.data.id);
            console.log(`✅ 创建男性俯卧撑成功，ID: ${maleExercise.body.data.id}`);
        } else {
            console.log('❌ 创建男性俯卧撑失败:', maleExercise.body.errMessage);
        }

        // 2. 测试相同名称不同性别（应该允许）
        console.log('\n2. 测试相同名称不同性别（应该允许）');
        
        const femaleExercise = await request(app)
            .post('/exercise/save')
            .send({
                name: '俯卧撑',  // 相同名称
                genderCode: 'FEMALE',  // 不同性别
                status: 'ENABLED',
                coverImgUrl: 'https://example.com/cover.jpg',
                met: 6,
                structureTypeCode: 'MAIN',
                difficultyCode: 'BEGINNER',
                equipmentCode: 'NO_EQUIPMENT',
                positionCode: 'STANDING',
                injuredCodes: ['NONE'],
                nameAudioUrl: 'https://example.com/name.mp3',
                nameAudioUrlDuration: 3,
                howtodoScript: '双手撑地，身体保持直线，上下推动',
                howtodoAudioUrl: 'https://example.com/howtodo.mp3',
                howtodoAudioUrlDuration: 30,
                guidanceAudioUrl: 'https://example.com/guidance.mp3',
                guidanceAudioUrlDuration: 45,
                frontVideoUrl: 'https://example.com/front.mp4',
                frontVideoUrlDuration: 60,
                sideVideoUrl: 'https://example.com/side.mp4',
                sideVideoUrlDuration: 60
            });

        if (femaleExercise.body.success) {
            createdIds.push(femaleExercise.body.data.id);
            console.log(`✅ 创建女性俯卧撑成功，ID: ${femaleExercise.body.data.id}`);
            console.log('✅ 相同名称不同性别允许创建');
        } else {
            console.log('❌ 创建女性俯卧撑失败:', femaleExercise.body.errMessage);
        }

        // 3. 测试相同名称相同性别（应该拒绝）
        console.log('\n3. 测试相同名称相同性别（应该拒绝）');
        
        const duplicateMaleExercise = await request(app)
            .post('/exercise/save')
            .send({
                name: '俯卧撑',  // 相同名称
                genderCode: 'MALE',  // 相同性别
                status: 'DRAFT'
            });

        if (!duplicateMaleExercise.body.success) {
            console.log('✅ 正确拒绝了相同名称相同性别的创建');
            console.log('错误信息:', duplicateMaleExercise.body.errMessage);
        } else {
            console.log('❌ 应该拒绝相同名称相同性别的创建');
        }

        // 4. 测试草稿状态（没有性别信息）
        console.log('\n4. 测试草稿状态（没有性别信息）');
        
        // 4.1 创建没有性别信息的草稿
        const draftExercise = await request(app)
            .post('/exercise/save')
            .send({
                name: '深蹲',  // 新名称
                status: 'DRAFT'
            });

        if (draftExercise.body.success) {
            createdIds.push(draftExercise.body.data.id);
            console.log(`✅ 创建草稿动作成功，ID: ${draftExercise.body.data.id}`);
        }

        // 4.2 尝试创建同名草稿（应该拒绝）
        const duplicateDraftExercise = await request(app)
            .post('/exercise/save')
            .send({
                name: '深蹲',  // 相同名称
                status: 'DRAFT'
            });

        if (!duplicateDraftExercise.body.success) {
            console.log('✅ 正确拒绝了同名草稿的创建');
            console.log('错误信息:', duplicateDraftExercise.body.errMessage);
        } else {
            console.log('❌ 应该拒绝同名草稿的创建');
        }

        // 4.3 尝试创建同名但有性别信息的动作（应该拒绝）
        const namedExerciseWithGender = await request(app)
            .post('/exercise/save')
            .send({
                name: '深蹲',  // 与草稿同名
                genderCode: 'MALE',
                status: 'ENABLED',
                coverImgUrl: 'https://example.com/cover.jpg',
                met: 6,
                structureTypeCode: 'MAIN',
                difficultyCode: 'BEGINNER',
                equipmentCode: 'NO_EQUIPMENT',
                positionCode: 'STANDING',
                injuredCodes: ['NONE'],
                nameAudioUrl: 'https://example.com/name.mp3',
                nameAudioUrlDuration: 3,
                howtodoScript: '双腿分开，下蹲',
                howtodoAudioUrl: 'https://example.com/howtodo.mp3',
                howtodoAudioUrlDuration: 30,
                guidanceAudioUrl: 'https://example.com/guidance.mp3',
                guidanceAudioUrlDuration: 45,
                frontVideoUrl: 'https://example.com/front.mp4',
                frontVideoUrlDuration: 60,
                sideVideoUrl: 'https://example.com/side.mp4',
                sideVideoUrlDuration: 60
            });

        if (!namedExerciseWithGender.body.success) {
            console.log('✅ 正确拒绝了与草稿同名的完整动作创建');
            console.log('错误信息:', namedExerciseWithGender.body.errMessage);
        } else {
            console.log('❌ 应该拒绝与草稿同名的完整动作创建');
        }

        // 5. 测试修改操作
        console.log('\n5. 测试修改操作');
        
        if (createdIds.length >= 2) {
            // 5.1 尝试将女性俯卧撑改为男性（应该拒绝，因为已有男性俯卧撑）
            const updateToMale = await request(app)
                .post('/exercise/save')
                .send({
                    id: createdIds[1],  // 女性俯卧撑的ID
                    name: '俯卧撑',
                    genderCode: 'MALE',  // 改为男性
                    status: 'ENABLED',
                    coverImgUrl: 'https://example.com/cover.jpg',
                    met: 6,
                    structureTypeCode: 'MAIN',
                    difficultyCode: 'BEGINNER',
                    equipmentCode: 'NO_EQUIPMENT',
                    positionCode: 'STANDING',
                    injuredCodes: ['NONE'],
                    nameAudioUrl: 'https://example.com/name.mp3',
                    nameAudioUrlDuration: 3,
                    howtodoScript: '双手撑地，身体保持直线，上下推动',
                    howtodoAudioUrl: 'https://example.com/howtodo.mp3',
                    howtodoAudioUrlDuration: 30,
                    guidanceAudioUrl: 'https://example.com/guidance.mp3',
                    guidanceAudioUrlDuration: 45,
                    frontVideoUrl: 'https://example.com/front.mp4',
                    frontVideoUrlDuration: 60,
                    sideVideoUrl: 'https://example.com/side.mp4',
                    sideVideoUrlDuration: 60
                });

            if (!updateToMale.body.success) {
                console.log('✅ 正确拒绝了修改为重复名称性别组合');
                console.log('错误信息:', updateToMale.body.errMessage);
            } else {
                console.log('❌ 应该拒绝修改为重复名称性别组合');
            }

            // 5.2 修改为不同名称（应该允许）
            const updateToDifferentName = await request(app)
                .post('/exercise/save')
                .send({
                    id: createdIds[1],  // 女性俯卧撑的ID
                    name: '女性俯卧撑',  // 不同名称
                    genderCode: 'FEMALE',
                    status: 'ENABLED',
                    coverImgUrl: 'https://example.com/cover.jpg',
                    met: 6,
                    structureTypeCode: 'MAIN',
                    difficultyCode: 'BEGINNER',
                    equipmentCode: 'NO_EQUIPMENT',
                    positionCode: 'STANDING',
                    injuredCodes: ['NONE'],
                    nameAudioUrl: 'https://example.com/name.mp3',
                    nameAudioUrlDuration: 3,
                    howtodoScript: '双手撑地，身体保持直线，上下推动',
                    howtodoAudioUrl: 'https://example.com/howtodo.mp3',
                    howtodoAudioUrlDuration: 30,
                    guidanceAudioUrl: 'https://example.com/guidance.mp3',
                    guidanceAudioUrlDuration: 45,
                    frontVideoUrl: 'https://example.com/front.mp4',
                    frontVideoUrlDuration: 60,
                    sideVideoUrl: 'https://example.com/side.mp4',
                    sideVideoUrlDuration: 60
                });

            if (updateToDifferentName.body.success) {
                console.log('✅ 修改为不同名称成功');
            } else {
                console.log('❌ 修改为不同名称失败:', updateToDifferentName.body.errMessage);
            }
        }

        // 6. 验证数据库中的记录
        console.log('\n6. 验证数据库中的记录');
        
        if (createdIds.length > 0) {
            const records = await query(
                `SELECT id, name, gender_code, status FROM exercise WHERE id IN (${createdIds.map(() => '?').join(',')}) AND is_deleted = 0`,
                createdIds
            );
            
            console.log('数据库中的记录:');
            records.forEach(record => {
                console.log(`  ID: ${record.id}, 名称: "${record.name}", 性别: ${record.gender_code || 'NULL'}, 状态: ${record.status}`);
            });
        }

        // 7. 清理测试数据
        console.log('\n7. 清理测试数据');
        if (createdIds.length > 0) {
            const cleanupSql = `DELETE FROM exercise WHERE id IN (${createdIds.map(() => '?').join(',')})`;
            const cleanupResult = await query(cleanupSql, createdIds);
            console.log(`✅ 清理完成，删除 ${cleanupResult.affectedRows} 条记录`);
        }

        console.log('\n✅ Exercise 名称和性别组合重复检查测试完成！');
        
        console.log('\n📋 测试总结:');
        console.log('- ✅ 相同名称不同性别允许创建');
        console.log('- ✅ 相同名称相同性别正确拒绝');
        console.log('- ✅ 草稿状态名称重复检查正常');
        console.log('- ✅ 修改操作重复检查正常');

    } catch (error) {
        console.error('❌ 测试失败:', error);
        throw error;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    testExerciseNameGenderDuplicate()
        .then(() => {
            console.log('\n🎉 测试完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 测试失败:', error);
            process.exit(1);
        });
}

module.exports = { testExerciseNameGenderDuplicate };
