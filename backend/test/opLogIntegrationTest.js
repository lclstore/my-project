/**
 * 操作日志集成测试
 * 测试各个模块的操作日志记录功能
 */

const axios = require('axios');

// 配置
const BASE_URL = 'http://localhost:3000/api';

async function testOpLogIntegration() {
    console.log('🚀 开始测试操作日志集成功能...\n');

    try {
        // 1. 测试Music模块操作日志
        console.log('1. 测试Music模块操作日志...');
        await testMusicOpLogs();
        console.log('');

        // 2. 测试Playlist模块操作日志
        console.log('2. 测试Playlist模块操作日志...');
        await testPlaylistOpLogs();
        console.log('');

        // 3. 测试Sound模块操作日志
        console.log('3. 测试Sound模块操作日志...');
        await testSoundOpLogs();
        console.log('');

        // 4. 验证操作日志记录
        console.log('4. 验证操作日志记录...');
        await verifyOpLogs();
        console.log('');

        console.log('\n🎉 操作日志集成测试完成！');

    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        if (error.response) {
            console.error('错误响应:', JSON.stringify(error.response.data, null, 2));
        }
        throw error;
    }
}

async function testMusicOpLogs() {
    const musicAPI = `${BASE_URL}/music`;

    // 创建music
    console.log('  📝 创建music...');
    const createResponse = await axios.post(`${musicAPI}/save`, {
        name: '测试音乐-日志',
        displayName: '测试音乐显示名称-日志',
        audioUrl: 'https://example.com/test-log-music.mp3',
        audioDuration: 200,
        status: 'DRAFT'
    }, {
        headers: {
            'x-user-id': '测试用户-Music'
        }
    });

    const musicId = createResponse.data.data.id;
    console.log(`  ✅ 创建music成功，ID: ${musicId}`);

    // 更新music
    console.log('  📝 更新music...');
    await axios.post(`${musicAPI}/save`, {
        id: musicId,
        name: '更新后的测试音乐-日志',
        displayName: '更新后的测试音乐显示名称-日志',
        audioUrl: 'https://example.com/updated-test-log-music.mp3',
        audioDuration: 250,
        status: 'ENABLED'
    }, {
        headers: {
            'x-user-id': '测试用户-Music'
        }
    });
    console.log('  ✅ 更新music成功');

    // 批量启用
    console.log('  📝 批量启用music...');
    await axios.post(`${musicAPI}/enable`, {
        idList: [musicId]
    }, {
        headers: {
            'x-user-id': '测试用户-Music'
        }
    });
    console.log('  ✅ 批量启用music成功');

    // 批量禁用
    console.log('  📝 批量禁用music...');
    await axios.post(`${musicAPI}/disable`, {
        idList: [musicId]
    }, {
        headers: {
            'x-user-id': '测试用户-Music'
        }
    });
    console.log('  ✅ 批量禁用music成功');

    // 批量删除
    console.log('  📝 批量删除music...');
    await axios.post(`${musicAPI}/del`, {
        idList: [musicId]
    }, {
        headers: {
            'x-user-id': '测试用户-Music'
        }
    });
    console.log('  ✅ 批量删除music成功');

    return musicId;
}

async function testPlaylistOpLogs() {
    const playlistAPI = `${BASE_URL}/playlist`;

    // 创建playlist
    console.log('  📝 创建playlist...');
    const createResponse = await axios.post(`${playlistAPI}/save`, {
        name: '测试播放列表-日志',
        type: 'REGULAR',
        premium: 0,
        status: 'DRAFT',
        musicList: [
            { bizMusicId: 1, premium: 0 },
            { bizMusicId: 2, premium: 1 }
        ]
    }, {
        headers: {
            'x-user-id': '测试用户-Playlist'
        }
    });

    const playlistId = createResponse.data.data.id;
    console.log(`  ✅ 创建playlist成功，ID: ${playlistId}`);

    // 更新playlist
    console.log('  📝 更新playlist...');
    await axios.post(`${playlistAPI}/save`, {
        id: playlistId,
        name: '更新后的测试播放列表-日志',
        type: 'YOGA',
        premium: 1,
        status: 'ENABLED',
        musicList: [
            { bizMusicId: 3, premium: 1 },
            { bizMusicId: 4, premium: 0 },
            { bizMusicId: 5, premium: 1 }
        ]
    }, {
        headers: {
            'x-user-id': '测试用户-Playlist'
        }
    });
    console.log('  ✅ 更新playlist成功');

    // 批量启用
    console.log('  📝 批量启用playlist...');
    await axios.post(`${playlistAPI}/enable`, {
        idList: [playlistId]
    }, {
        headers: {
            'x-user-id': '测试用户-Playlist'
        }
    });
    console.log('  ✅ 批量启用playlist成功');

    // 批量禁用
    console.log('  📝 批量禁用playlist...');
    await axios.post(`${playlistAPI}/disable`, {
        idList: [playlistId]
    }, {
        headers: {
            'x-user-id': '测试用户-Playlist'
        }
    });
    console.log('  ✅ 批量禁用playlist成功');

    // 批量删除
    console.log('  📝 批量删除playlist...');
    await axios.post(`${playlistAPI}/del`, {
        idList: [playlistId]
    }, {
        headers: {
            'x-user-id': '测试用户-Playlist'
        }
    });
    console.log('  ✅ 批量删除playlist成功');

    return playlistId;
}

async function testSoundOpLogs() {
    const soundAPI = `${BASE_URL}/sound`;

    // 创建sound
    console.log('  📝 创建sound...');
    const createResponse = await axios.post(`${soundAPI}/save`, {
        name: '测试音频-日志',
        url: 'https://example.com/test-sound-log.mp3',
        duration: 120,
        status: 'ENABLED'
    }, {
        headers: {
            'x-user-id': '测试用户-Sound'
        }
    });

    const soundId = createResponse.data.data.id;
    console.log(`  ✅ 创建sound成功，ID: ${soundId}`);

    // 更新sound
    console.log('  📝 更新sound...');
    await axios.post(`${soundAPI}/save`, {
        id: soundId,
        name: '更新后的测试音频-日志',
        url: 'https://example.com/updated-test-sound-log.mp3',
        duration: 150,
        status: 'ENABLED'
    }, {
        headers: {
            'x-user-id': '测试用户-Sound'
        }
    });
    console.log('  ✅ 更新sound成功');

    // 批量启用
    console.log('  📝 批量启用sound...');
    await axios.post(`${soundAPI}/enable`, {
        idList: [soundId]
    }, {
        headers: {
            'x-user-id': '测试用户-Sound'
        }
    });
    console.log('  ✅ 批量启用sound成功');

    // 批量禁用
    console.log('  📝 批量禁用sound...');
    await axios.post(`${soundAPI}/disable`, {
        idList: [soundId]
    }, {
        headers: {
            'x-user-id': '测试用户-Sound'
        }
    });
    console.log('  ✅ 批量禁用sound成功');

    // 批量删除
    console.log('  📝 批量删除sound...');
    await axios.post(`${soundAPI}/del`, {
        idList: [soundId]
    }, {
        headers: {
            'x-user-id': '测试用户-Sound'
        }
    });
    console.log('  ✅ 批量删除sound成功');

    return soundId;
}

async function verifyOpLogs() {
    const opLogsAPI = `${BASE_URL}/opLogs`;

    // 查询最近的操作日志
    console.log('  📋 查询最近的操作日志...');
    const logsResponse = await axios.get(`${opLogsAPI}/page?pageSize=20&orderBy=operationTime&orderDirection=desc`);

    const logs = logsResponse.data.data;
    console.log(`  📊 找到 ${logs.length} 条操作日志`);

    // 验证日志内容
    const musicLogs = logs.filter(log => log.bizType === 'music');
    const playlistLogs = logs.filter(log => log.bizType === 'playlist');
    const soundLogs = logs.filter(log => log.bizType === 'sound');

    console.log(`  🎵 Music操作日志: ${musicLogs.length} 条`);
    console.log(`  📋 Playlist操作日志: ${playlistLogs.length} 条`);
    console.log(`  🔊 Sound操作日志: ${soundLogs.length} 条`);

    // 验证操作类型
    const operationTypes = [...new Set(logs.map(log => log.operationType))];
    console.log(`  🔧 操作类型: ${operationTypes.join(', ')}`);

    // 验证操作用户
    const operationUsers = [...new Set(logs.map(log => log.operationUser))];
    console.log(`  👤 操作用户: ${operationUsers.join(', ')}`);

    // 显示最近的几条日志
    console.log('  📝 最近的操作日志:');
    logs.slice(0, 5).forEach((log, index) => {
        console.log(`    ${index + 1}. [${log.bizType}] ${log.operationType} - ${log.dataInfo} (${log.operationUser})`);
    });

    // 测试按业务类型搜索
    console.log('  🔍 测试按业务类型搜索...');
    const musicSearchResponse = await axios.get(`${opLogsAPI}/page?keywords=music&pageSize=10`);
    console.log(`  ✅ 搜索music相关日志: ${musicSearchResponse.data.data.length} 条`);

    // 测试按操作类型筛选
    console.log('  🔍 测试按操作类型筛选...');
    const addUpdateResponse = await axios.get(`${opLogsAPI}/page?operationTypeList=ADD,UPDATE&pageSize=10`);
    console.log(`  ✅ 筛选ADD,UPDATE操作: ${addUpdateResponse.data.data.length} 条`);

    console.log('  ✅ 操作日志验证完成');
}

// 如果直接运行此脚本
if (require.main === module) {
    testOpLogIntegration()
        .then(() => {
            console.log('\n✅ 集成测试完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 集成测试失败:', error);
            process.exit(1);
        });
}

module.exports = { testOpLogIntegration };
