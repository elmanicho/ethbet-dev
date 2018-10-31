import React, {Component} from 'react';

import {bindActionCreators} from 'redux';
import {connect} from 'react-redux'

import Loader from 'react-loader';

import * as notificationActions from '../../actions/notificationActions';
import * as etherBalanceActions from '../../actions/etherBalanceActions';

class Balance extends Component {

  constructor(props) {
    super(props);

    this.state = {};
  }

  componentDidMount() {

  }

  updateNewDepositValue(e) {
    this.props.etherBalanceActions.setNewDepositValue({ newDepositValue: e.target.value });
  }

  isValidNewDeposit() {
    let newDepositValue = parseFloat(this.props.etherBalanceStore.get("newDepositValue"));
    return newDepositValue > 0;
  }

  saveNewDeposit() {
    this.props.etherBalanceActions.saveNewDeposit();
  }

  updateNewWithdrawalValue(e) {
    this.props.etherBalanceActions.setNewWithdrawalValue({ newWithdrawalValue: e.target.value });
  }

  isValidNewWithdrawal() {
    let newWithdrawalValue = parseFloat(this.props.etherBalanceStore.get("newWithdrawalValue"));
    return newWithdrawalValue > 0;
  }

  saveNewWithdrawal() {
    this.props.etherBalanceActions.saveNewWithdrawal();
  }

  updateNewEthDepositValue(e) {
    this.props.etherBalanceActions.setNewEthDepositValue({ newEthDepositValue: e.target.value });
  }

  isValidNewEthDeposit() {
    let newEthDepositValue = parseFloat(this.props.etherBalanceStore.get("newEthDepositValue"));
    return newEthDepositValue > 0;
  }

  saveNewEthDeposit() {
    this.props.etherBalanceActions.saveNewEthDeposit();
  }

  updateNewEthWithdrawalValue(e) {
    this.props.etherBalanceActions.setNewEthWithdrawalValue({ newEthWithdrawalValue: e.target.value });
  }

  isValidNewEthWithdrawal() {
    let newEthWithdrawalValue = parseFloat(this.props.etherBalanceStore.get("newEthWithdrawalValue"));
    return newEthWithdrawalValue > 0;
  }

  saveNewEthWithdrawal() {
    this.props.etherBalanceActions.saveNewEthWithdrawal();
  }
  
  
  render() {
    let { etherBalanceStore } = this.props;

    return (
      <div className="col-lg-7">
        <div className="well">
          <div className="row">
            <div className="col-lg-6">
              <legend>EBET</legend>
            </div>

            <div className="col-lg-6">
              <legend>ETH</legend>
            </div>
          </div>

          <div className="row">
            <div className="col-lg-6">
              <div className="row">
                <div className="col-lg-6">
                  <input name="deposit" type="text"
                         value={etherBalanceStore.get("newDepositValue")}
                         onChange={(e) => this.updateNewDepositValue(e)}
                         className="form-control" placeholder="Deposit EBET"/>
                </div>
                <div className="col-lg-6">
                  <button type="button" className="btn btn-info" onClick={this.saveNewDeposit.bind(this)}
                          disabled={!this.isValidNewDeposit() || etherBalanceStore.get("savingNewDeposit")}>
                    Deposit
                  </button>
                </div>
              </div>

              <div className="row">
                <div className="col-lg-12">
                  <Loader color="white" loaded={!etherBalanceStore.get("savingNewDeposit")}/>
                </div>
              </div>

              <hr/>

              <div className="row">
                <div className="col-lg-6">
                  <input name="withdrawal" type="text"
                         value={etherBalanceStore.get("newWithdrawalValue")}
                         onChange={(e) => this.updateNewWithdrawalValue(e)}
                         className="form-control" placeholder="Withdraw EBET"/>
                </div>
                <div className="col-lg-6">
                  <button type="button" className="btn btn-info" onClick={this.saveNewWithdrawal.bind(this)}
                          disabled={!this.isValidNewWithdrawal() || etherBalanceStore.get("savingNewWithdrawal")}>
                    Withdraw
                  </button>
                </div>
              </div>
              <Loader color="white" loaded={!etherBalanceStore.get("savingNewWithdrawal")}/>
            </div>

            <div className="col-lg-6">
              <div className="row">
                <div className="col-lg-6">
                  <input name="ethDeposit" type="text"
                         value={etherBalanceStore.get("newEthDepositValue")}
                         onChange={(e) => this.updateNewEthDepositValue(e)}
                         className="form-control" placeholder="Deposit ETH"/>
                </div>
                <div className="col-lg-6">
                  <button type="button" className="btn btn-info" onClick={this.saveNewEthDeposit.bind(this)}
                          disabled={!this.isValidNewEthDeposit() || etherBalanceStore.get("savingNewEthDeposit")}>
                    Deposit
                  </button>
                </div>
              </div>

              <div className="row">
                <div className="col-lg-12">
                  <Loader color="white" loaded={!etherBalanceStore.get("savingNewEthDeposit")}/>
                </div>
              </div>

              <hr/>

              <div className="row">
                <div className="col-lg-6">
                  <input name="ethWithdrawal" type="text"
                         value={etherBalanceStore.get("newEthWithdrawalValue")}
                         onChange={(e) => this.updateNewEthWithdrawalValue(e)}
                         className="form-control" placeholder="Withdraw ETH"/>
                </div>
                <div className="col-lg-6">
                  <button type="button" className="btn btn-info" onClick={this.saveNewEthWithdrawal.bind(this)}
                          disabled={!this.isValidNewEthWithdrawal() || etherBalanceStore.get("savingNewEthWithdrawal")}>
                    Withdraw
                  </button>
                </div>
              </div>
              <Loader color="white" loaded={!etherBalanceStore.get("savingNewEthWithdrawal")}/>
            </div>
          </div>

          <br/>
          <br/>

        </div>
      </div>
    );
  }

}


const mapStateToProps = (state) => {
  return {
    etherBalanceStore: state.etherBalanceStore,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    notificationActions: bindActionCreators(notificationActions, dispatch),
    etherBalanceActions: bindActionCreators(etherBalanceActions, dispatch),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Balance);
