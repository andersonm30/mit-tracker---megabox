// store/modules/reports.js

const state = {
    reportData: {}
  };
  
  const mutations = {
    SET_REPORT_DATA(state, reportData) {
      state.reportData = reportData;
    }
  };
  
  const actions = {
    updateReportData({ commit }, reportData) {
      commit('SET_REPORT_DATA', reportData);
    }
  };
  
  export default {
    namespaced: true,
    state,
    mutations,
    actions
  };
  