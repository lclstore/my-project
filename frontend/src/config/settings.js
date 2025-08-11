
import {
  EditOutlined,
  StopOutlined,
  CheckCircleOutlined,
  CopyOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { del, disable, enable } from "./api.js"
import { useStore } from "@/store/index.js";
import { router } from "@/utils"
import { uploadFile } from "@/config/api.js"


const settings = {
  // 请求设置
  request: {
    tokenName: 'template-cms-token',
    interceptors: (config) => { config.headers['token'] = localStorage.getItem(settings.request.tokenName) },
    resInit: (res) => {
      res.tokenError = (res.data.errCode && res.data.errCode === "USR001")
      return res
    }
  },
  // List page
  listConfig: {
    rowButtonsPublic: [
      {
        key: "enable",
        icon: CheckCircleOutlined,
        click: async ({ selectList, moduleKey, getData }) => {
          await enable({ moduleKey, idList: selectList.map(item => item.id) })
          await getData()
        }
      },
      {
        key: "disable",
        icon: StopOutlined,
        click: async ({ selectList, moduleKey, getData }) => {
          await disable({ moduleKey, idList: selectList.map(item => item.id) })
          await getData()
        }
      },
      {
        key: "delete",
        icon: DeleteOutlined,
        click: async ({ selectList, moduleKey, getData }) => {
          await del({ moduleKey, idList: selectList.map(item => item.id) })
          await getData()
        }
      },
      {
        key: "edit",
        icon: EditOutlined,
        click: ({ selectList }) => router().push(`editor?id=${selectList[0].id}`)
      },
      {
        key: "duplicate",
        icon: CopyOutlined,
        click: ({ selectList }) => router().push(`editor?id=${selectList[0].id}&duplicate=true`)
      },
    ],
    rowClickPublic: ({ rowData }) => {
      router().push(`editor?id=${rowData.id}`)
    }
  },
  // 布局设置
  layout: {
    // 侧边栏宽度
    sidebarWidth: 250,
    // 头部高度
    headerHeight: 64,
    // 主题
    theme: 'dark',
  },

  //附件设置
  file: {
    baseURL: import.meta.env.VITE_FILE_PREVIEW_URL,
    // 文件目录
    dirname: 'test',
    uploadFile: ({ file, dirKey }) => {
      return uploadFile({
        file,
        dirKey: dirKey,
      });
    },
  },

  // 路由重定向设置
  router: {
    // 首页路由
    homePath: '/home/list',
  },

  // 菜单设置
  menu: {
    // 菜单顺序映射表（值越小越靠前）
    menuOrder: {
      'home': 1,
      'publish': 2,
      'sounds': 3,
      'exercises': 4,
      'workoutSettings': 5,
      'workouts': 6,
      'collections': 7,
      'plans': 8,
      'musics': 9,
      'operationRecords': 10,
      'users': 11,
      'profile': 12,
    },
    // 隐藏菜单配置
    menuHidden: ['profile']
  },

  // 自定义主题配置
  themeConfig: {
    token: {
      colorPrimary: '#1c8',
      colorSuccess: '#1c8',
      colorWarning: '#faad14',
      colorError: '#ff4d4f',
      colorInfo: '#1890ff',
      borderRadius: 12,
      colorBgHeader: '#243636',
      colorTextHeading: '#ffffff',
    },
    components: {
      Button: {
        // 高度设置为auto
        controlHeight: 40,
        borderRadius: 12,
        // 边框
        borderWidth: 1,
        // 字体大小
        fontSize: 13,
        fontWeight: 600,
      },
      Switch: {
        colorPrimary: '#1c8',
        colorPrimaryHover: '#11af75',
        inactiveColor: '#c0c6c6',
        lineHeight: 1.7
      },
      Input: {
        activeBorderColor: '#1c8',
        hoverBorderColor: '#1c8',
        activeShadow: 'none',
        paddingBlock: 8,
        controlHeight: 40

      },
      Select: {
        activeBorderColor: '#1c8',
        hoverBorderColor: '#1c8',
        activeShadow: 'none',
        activeColor: '#1c8',
        paddingBlock: 8,
        controlHeight: 40
      },
      Form: {
        labelColor: '#243636',
        labelFontSize: 16,
      },
      Modal: {
        colorIcon: '#ffffff',
        colorIconHover: '#ffffff',
      },
      Checkbox: {
        colorPrimary: '#1c8',
        colorPrimaryHover: '#11af75',
        inactiveColor: '#c0c6c6',
      },
      DatePicker: {
        colorPrimary: '#1c8',
        colorPrimaryHover: '#11af75',
        inactiveColor: '#c0c6c6',
        cellHeight: 40,
        controlHeight: 40,
        borderWidth: 1,
        activeBorderColor: '#1c8',
        hoverBorderColor: '#1c8',
        activeShadow: 'none',
        cellInRangeBg: 'none',
      },
      Tabs: {
        colorBorderSecondary: 'none', //默认下划线
        inkBarColor: '#1c8',          // 下划线颜色（激活tab）
        lineWidthBold: 5,             // 下划线高度
        itemColor: '#243636',            // 非激活tab颜色
        itemActiveColor: '#243636',      // 激活tab文字颜色
        itemHoverColor: '#243636',       // hover时颜色
        itemSelectedColor: '#243636',    // 被选中tab文字颜色（等于 itemActiveColor）
      },
      Collapse: {
        colorTextHeading: "rgba(0,0,0,0.7)"
      }
    }
  }

};

export default settings; 