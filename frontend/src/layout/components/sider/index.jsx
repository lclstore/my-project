import SideMenu from '../menu'
import { useNavigate } from 'react-router-dom'
import React, { useEffect, useState } from 'react';
import "./sider.css"
import request from "@/request";
import CMS from "@/assets/images/logo_laien.png"
import { useStore } from "@/store/index.js";

export default function Sider() {
    const [users, setUser] = useState('');
    const setUserInfo = useStore((state) => state.setUserInfo);
    const userInfo = useStore((state) => state.userInfo);
    const navigate = useNavigate();
    const getUser = async () => {
        return new Promise(resolve => {
            request.get({
                url: `/user/getMyInfo`,
                load: true,
                callback: res => {
                    if (res.data.success) {
                        console.log(res.data.data)
                        setUserInfo(res.data.data)
                    }
                    // setUser(res.data.data)
                }
            });
        })
    }
    useEffect(() => {
        getUser().then()
    }, []);

    const handleCreateWorkout = () => {

        navigate('/exercises/editor')
    }
    const goProfile = () => {
        navigate('/profile/list')
    }
    return (
        <div style={{ height: '100vh', overflow: "hidden" }}>
            {/* <div className="createWorkoutBtn" onClick={handleCreateWorkout}>CREATE WORKOUT</div> */}
            <div className='createWorkoutBtn1_box'>
                <img className='createWorkoutBtn1_img' src={CMS} alt="" />
                <div className='createWorkoutBtn1'>Content System</div>
            </div>
            <SideMenu />
            <div className='Profile' onClick={goProfile} >
                <div className='Profile-avatar'></div>
                <div className='mask'>
                    <img className='Profile-avatar-img' src={userInfo?.avatar} alt="" />
                </div>
                <div style={{ 'margin': '16px 0' }}>
                    <div className='Profile-usename'>{userInfo?.name}</div>
                    <div className='Profile-eamil'>{userInfo?.email}</div>
                </div>
            </div>
        </div >
    )
}