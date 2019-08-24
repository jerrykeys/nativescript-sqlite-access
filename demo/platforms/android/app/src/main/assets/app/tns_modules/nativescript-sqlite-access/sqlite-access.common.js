"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var observable_1 = require("tns-core-modules/data/observable");
var app = require("tns-core-modules/application");
var dialogs = require("tns-core-modules/ui/dialogs");
var Common = /** @class */ (function (_super) {
    __extends(Common, _super);
    function Common() {
        var _this = _super.call(this) || this;
        _this.message = Utils.SUCCESS_MSG();
        return _this;
    }
    Common.prototype.greet = function () {
        return "Hello, NS";
    };
    return Common;
}(observable_1.Observable));
exports.Common = Common;
var Utils = /** @class */ (function () {
    function Utils() {
    }
    Utils.SUCCESS_MSG = function () {
        var msg = "Your plugin is working on " + (app.android ? 'Android' : 'iOS') + ".";
        setTimeout(function () {
            dialogs.alert(msg + " For real. It's really working :)").then(function () { return console.log("Dialog closed."); });
        }, 2000);
        return msg;
    };
    return Utils;
}());
exports.Utils = Utils;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3FsaXRlLWFjY2Vzcy5jb21tb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzcWxpdGUtYWNjZXNzLmNvbW1vbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLCtEQUE4RDtBQUM5RCxrREFBb0Q7QUFDcEQscURBQXVEO0FBRXZEO0lBQTRCLDBCQUFVO0lBR3BDO1FBQUEsWUFDRSxpQkFBTyxTQUVSO1FBREMsS0FBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUMsV0FBVyxFQUFFLENBQUM7O0lBQ3JDLENBQUM7SUFFTSxzQkFBSyxHQUFaO1FBQ0UsT0FBTyxXQUFXLENBQUM7SUFDckIsQ0FBQztJQUNILGFBQUM7QUFBRCxDQUFDLEFBWEQsQ0FBNEIsdUJBQVUsR0FXckM7QUFYWSx3QkFBTTtBQWFuQjtJQUFBO0lBVUEsQ0FBQztJQVRlLGlCQUFXLEdBQXpCO1FBQ0UsSUFBSSxHQUFHLEdBQUcsZ0NBQTZCLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxPQUFHLENBQUM7UUFFMUUsVUFBVSxDQUFDO1lBQ1QsT0FBTyxDQUFDLEtBQUssQ0FBSSxHQUFHLHNDQUFtQyxDQUFDLENBQUMsSUFBSSxDQUFDLGNBQU0sT0FBQSxPQUFPLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDLEVBQTdCLENBQTZCLENBQUMsQ0FBQztRQUNyRyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFVCxPQUFPLEdBQUcsQ0FBQztJQUNiLENBQUM7SUFDSCxZQUFDO0FBQUQsQ0FBQyxBQVZELElBVUM7QUFWWSxzQkFBSyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE9ic2VydmFibGUgfSBmcm9tICd0bnMtY29yZS1tb2R1bGVzL2RhdGEvb2JzZXJ2YWJsZSc7XG5pbXBvcnQgKiBhcyBhcHAgZnJvbSAndG5zLWNvcmUtbW9kdWxlcy9hcHBsaWNhdGlvbic7XG5pbXBvcnQgKiBhcyBkaWFsb2dzIGZyb20gJ3Rucy1jb3JlLW1vZHVsZXMvdWkvZGlhbG9ncyc7XG5cbmV4cG9ydCBjbGFzcyBDb21tb24gZXh0ZW5kcyBPYnNlcnZhYmxlIHtcbiAgcHVibGljIG1lc3NhZ2U6IHN0cmluZztcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMubWVzc2FnZSA9IFV0aWxzLlNVQ0NFU1NfTVNHKCk7XG4gIH1cblxuICBwdWJsaWMgZ3JlZXQoKSB7XG4gICAgcmV0dXJuIFwiSGVsbG8sIE5TXCI7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFV0aWxzIHtcbiAgcHVibGljIHN0YXRpYyBTVUNDRVNTX01TRygpOiBzdHJpbmcge1xuICAgIGxldCBtc2cgPSBgWW91ciBwbHVnaW4gaXMgd29ya2luZyBvbiAke2FwcC5hbmRyb2lkID8gJ0FuZHJvaWQnIDogJ2lPUyd9LmA7XG5cbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGRpYWxvZ3MuYWxlcnQoYCR7bXNnfSBGb3IgcmVhbC4gSXQncyByZWFsbHkgd29ya2luZyA6KWApLnRoZW4oKCkgPT4gY29uc29sZS5sb2coYERpYWxvZyBjbG9zZWQuYCkpO1xuICAgIH0sIDIwMDApO1xuXG4gICAgcmV0dXJuIG1zZztcbiAgfVxufVxuIl19