"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
require("./App.css");
const ditto_1 = __importDefault(require("./ditto"));
let ditto;
let liveQuery;
function App() {
    const [cars, setCars] = (0, react_1.useState)(0);
    const [error, setError] = (0, react_1.useState)('');
    (0, react_1.useEffect)(() => {
        function startDitto() {
            return __awaiter(this, void 0, void 0, function* () {
                ditto = (0, ditto_1.default)();
                liveQuery = ditto.store.collection('cars').findAll().observeLocal((tickets) => {
                    setCars(tickets.length);
                });
            });
        }
        startDitto();
        return () => {
            liveQuery === null || liveQuery === void 0 ? void 0 : liveQuery.stop();
        };
    }, []);
    function onAddClick() {
        if (!ditto)
            return setError('No ditto.');
        setError('');
        ditto.store.collection('cars').upsert({
            "name": 'Toyota'
        });
    }
    return (<div className="App">
      <header className="App-header">
        <div>
          <h3>
          {cars} cars
          </h3>
          {error && <p style={{ "color": "red" }}>{error}</p>}
          <button onClick={onAddClick}>+</button>
        </div>
      </header>
    </div>);
}
exports.default = App;
