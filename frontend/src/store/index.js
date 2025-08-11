import { create } from 'zustand'
import { optionsConstants } from "./options.jsx"

export const useStore= create((set,get) => ({
  // 全局loading
  loadingGlobal: false,
  setLoadingGlobal: (loadingGlobal) => set({ loadingGlobal }),
  // 全局的 navigate
  navigate:null,
  setNavigate: (navigate) => set({ navigate }),
  // 全局的 Location 信息
  location:null,
  setLocation: (location) => set({ location }),
  // user message 用户信息
  defaultImg: "https://nilou.7mfitness.com/internal/push/4934b507d7fe43cb8753b9d35bbe7186.svg",
  userInfo: {},
  setUserInfo: (userInfo) => set((state) => ({
    userInfo:{
      ...userInfo,
      avatar: userInfo.avatar ? userInfo.avatar:state.defaultImg
    }
  })),
  // 映射表信息
  optionsBase:{
    ...optionsConstants,
    getLabel:(optionName,value) => {
      const optionsBase = get().optionsBase;
      const base = typeof optionName === 'string'? optionsBase[optionName]:[].concat(...optionName.map(i => optionsBase[i]))
      return base.find(item => item[typeof value === 'number'?"code":"value"] === value)?.label
    },
  },
  optionsBaseAdd:(optionsBase) => set((state) => ({ optionsBase:{...state.optionsBase,  ...optionsBase} })),
  optionsBaseGetValue:(optionName,value) => get().optionsBase[optionName].find(item => item.value === value).label,
}))