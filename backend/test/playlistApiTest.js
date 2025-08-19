/**
 * Playlist API 测试
 */

const axios = require('axios');

// 配置
const BASE_URL = 'http://localhost:3000/api';
const API_URL = `${BASE_URL}/playlist`;

// 测试数据
const testPlaylistData = {
    name: '测试播放列表',
    type: 'REGULAR',
    premium: 0,
    status: 'DRAFT',
    musicList: [
        {
            bizMusicId: 1,
            premium: 0
        },
        {
            bizMusicId: 2,
            premium: 1
        }
    ]
};

let createdPlaylistId = null;

async function testPlaylistAPI() {
    console.log('🚀 开始测试Playlist API...\n');

    try {
        // 1. 测试保存playlist（创建）
        console.log('1. 测试创建playlist...');
        const saveResponse = await axios.post(`${API_URL}/save`, testPlaylistData);
        console.log('✅ 创建playlist成功');
        console.log('响应数据:', JSON.stringify(saveResponse.data, null, 2));

        createdPlaylistId = saveResponse.data.data.id;
        console.log(`📝 创建的playlist ID: ${createdPlaylistId}\n`);

        // 2. 测试获取playlist详情
        console.log('2. 测试获取playlist详情...');
        const detailResponse = await axios.get(`${API_URL}/detail/${createdPlaylistId}`);
        console.log('✅ 获取playlist详情成功');
        console.log('详情数据:', JSON.stringify(detailResponse.data, null, 2));

        // 验证musicList包含完整的music信息
        if (detailResponse.data.data && detailResponse.data.data.musicList) {
            const musicList = detailResponse.data.data.musicList;
            console.log(`📋 musicList数量: ${musicList.length}`);

            musicList.forEach((music, index) => {
                console.log(`   音乐 ${index + 1}:`);
                console.log(`     bizMusicId: ${music.bizMusicId}`);
                console.log(`     id: ${music.id || '未找到'}`);
                console.log(`     name: ${music.name || '未找到'}`);
                console.log(`     displayName: ${music.displayName || '未找到'}`);
                console.log(`     audioDuration: ${music.audioDuration || '未找到'}`);
                console.log(`     status: ${music.status || '未找到'}`);
                console.log(`     createTime: ${music.createTime || '未找到'}`);

                if (music.name && music.displayName && music.id) {
                    console.log(`     ✅ 包含完整music信息（使用公共方法转换字段）`);
                } else {
                    console.log(`     ⚠️ music信息不完整（可能music不存在）`);
                }
            });
        }
        console.log('');

        // 3. 测试分页查询
        console.log('3. 测试分页查询playlist...');
        const pageResponse = await axios.get(`${API_URL}/page?pageIndex=1&pageSize=10`);
        console.log('✅ 分页查询playlist成功');
        console.log('分页数据:', JSON.stringify(pageResponse.data, null, 2));

        // 验证musicCount字段
        if (pageResponse.data.data && pageResponse.data.data.length > 0) {
            const firstItem = pageResponse.data.data[0];
            if (firstItem.musicCount !== undefined) {
                console.log(`✅ musicCount字段存在: ${firstItem.musicCount}`);
            } else {
                console.log('❌ musicCount字段不存在');
            }
        }
        console.log('');

        // 4. 测试更新playlist
        console.log('4. 测试更新playlist...');
        const updateData = {
            ...testPlaylistData,
            id: createdPlaylistId,
            name: '更新后的测试播放列表',
            type: 'YOGA',
            premium: 1,
            status: 'ENABLED',
            musicList: [
                {
                    bizMusicId: 3,
                    premium: 1
                },
                {
                    bizMusicId: 4,
                    premium: 0
                },
                {
                    bizMusicId: 5,
                    premium: 1
                }
            ]
        };
        const updateResponse = await axios.post(`${API_URL}/save`, updateData);
        console.log('✅ 更新playlist成功');
        console.log('更新响应:', JSON.stringify(updateResponse.data, null, 2));
        console.log('');

        // 5. 测试关键词搜索
        console.log('5. 测试关键词搜索...');
        const keywordsResponse = await axios.get(`${API_URL}/page?keywords=测试&pageSize=10`);
        console.log('✅ 关键词搜索成功');
        console.log('搜索结果:', JSON.stringify(keywordsResponse.data, null, 2));
        console.log('');

        // 6. 测试筛选查询
        console.log('6. 测试筛选查询...');
        const filterResponse = await axios.get(`${API_URL}/page?statusList=ENABLED&typeList=YOGA&premium=1&pageSize=10`);
        console.log('✅ 筛选查询成功');
        console.log('筛选结果:', JSON.stringify(filterResponse.data, null, 2));
        console.log('');

        // 7. 测试批量启用
        console.log('7. 测试批量启用playlist...');
        const enableResponse = await axios.post(`${API_URL}/enable`, {
            idList: [createdPlaylistId]
        });
        console.log('✅ 批量启用playlist成功');
        console.log('启用响应:', JSON.stringify(enableResponse.data, null, 2));
        console.log('');

        // 8. 测试批量禁用
        console.log('8. 测试批量禁用playlist...');
        const disableResponse = await axios.post(`${API_URL}/disable`, {
            idList: [createdPlaylistId]
        });
        console.log('✅ 批量禁用playlist成功');
        console.log('禁用响应:', JSON.stringify(disableResponse.data, null, 2));
        console.log('');

        // 9. 测试批量删除
        console.log('9. 测试批量删除playlist...');
        const deleteResponse = await axios.post(`${API_URL}/del`, {
            idList: [createdPlaylistId]
        });
        console.log('✅ 批量删除playlist成功');
        console.log('删除响应:', JSON.stringify(deleteResponse.data, null, 2));
        console.log('');

        // 10. 验证删除后无法获取详情
        console.log('10. 验证删除后无法获取详情...');
        try {
            await axios.get(`${API_URL}/detail/${createdPlaylistId}`);
            console.log('❌ 删除验证失败：仍能获取已删除的playlist');
        } catch (error) {
            if (error.response && error.response.status === 404) {
                console.log('✅ 删除验证成功：无法获取已删除的playlist');
            } else {
                console.log('⚠️ 删除验证出现意外错误:', error.message);
            }
        }

        console.log('\n🎉 所有Playlist API测试完成！');

    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        if (error.response) {
            console.error('错误响应:', JSON.stringify(error.response.data, null, 2));
        }
        throw error;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    testPlaylistAPI()
        .then(() => {
            console.log('\n✅ 测试完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 测试失败:', error);
            process.exit(1);
        });
}

module.exports = { testPlaylistAPI };
