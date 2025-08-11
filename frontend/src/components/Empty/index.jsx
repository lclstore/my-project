import React from 'react'
import PropTypes from 'prop-types'
import noDataImg from '@/assets/images/no-data.png'
import styles from './style.module.css'

/**
 * 空状态展示组件
 * @param {Object} props - 组件参数
 * @param {string} props.title - 空状态标题
 * @param {string} props.img - 自定义图片地址
 */
export default function Empty({ title = '', img }) {
    return (
        <div className={styles.customEmptyWrapper}>
            {/* 图片区域 */}
            <div className={styles.customEmptyImageWrapper}>
                <img src={img || noDataImg} alt="no data" className={styles.customEmptyImage} />
            </div>
            {/* 标题区域 */}
            <div className={styles.customEmptyTitle}>{title}</div>
        </div>
    )
}

// PropTypes类型校验
Empty.propTypes = {
    title: PropTypes.string,
    img: PropTypes.string
}