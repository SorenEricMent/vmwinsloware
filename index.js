const init_memory = 
    ["30", "F2", "00", "00", "00", "01",
     "30", "F1", "00", "00", "00", "05",
     "30", "F0", "00", "00", "00", "00",
     "62", "11",    // 62 11 00 00 00 00
     "71", "00", "00", "00", "22", // 71 00 00 00 00 22
     "60", "10", // 60 10 00 00 00 00
     "61", "21", // 61 21 00 00 00 00
     "70", "00", "00", "00", "12", // 70 00 00 00 00 00
     "00"];
//  Value provided for 2023winter
//  I see literally no point in the complexity of this prelab but okay
const init_register = 
    [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];

var ins = new CPU(false, init_memory, init_register);

const formatProperty = (propertyName) => `\x1b[33m${propertyName}\x1b[0m`;
const formatValue = (value) => `\x1b[32m${value}\x1b[0m`;

var emulation_time = 0;
while(!ins.halt)
{
    data = ins.step();
    let formattedOutput = '';

    for (const key in data) {
        if (Object.hasOwnProperty.call(data, key)) {
            formattedOutput += `${formatProperty(key)}: ${formatValue(data[key])}, `;
        }
    }
    formattedOutput = formattedOutput.slice(0, -2); // Remove the trailing comma and space
    console.log(formattedOutput);
}
emulation_time = performance.now();
console.log("\x1b[100mEmulation finished after: \x1b[32m" + emulation_time + "ns\x1b[37m\x1b[100m. Average clockspeed \x1b[32m" + ins.clock_counter / emulation_time + "GHz\x1b[37m\x1b[100m.\x1b[0m");
//  CPU.halt: Boolean
//  CPU.step() for one clock cycle;
//  CPU.full() for cycling until halt (INST 0x00)

function CPU(debug, mem, reg){
    console.log("\x1b[31mVMWinslowARE 1.0.0, emulator created.\x1b[0m");
    this.clock_counter = 0;
    this.debug = debug; // When true, output all registers/internal status for all clock cycles.
    this.memory = mem;
    this.reg = reg;
    this.PC = 0x0;
    this.nextPC = 0x0;
    this.halt = false;
    this.comm_friendly = "";

    this.icd = 0x0;
    this.ifn = 0x0;
    this.ra = 0x0;
    this.rb = 0x0;
    this.valc = 0x0;
    this.valp = 0x0;
    this.srca = 0x0;
    this.srcb = 0x0;
    this.dste = 0x0;
    this.vala = 0x0;
    this.valb = 0x0;
    this.vale = 0x0;
    this.bch = 0x0;
    this.alua = 0x0;
    this.alub = 0x0;

    this.regr = function(offset){
        if(offset == 0xF){
            return 0;
        }else{
            return this.reg[offset];
        }
    }

    this.regw = function(offset, val){
        if(offset == 0xF){
            return 0;
        }else{
            this.reg[offset] = val;
        }
    }
    
    this.step = function (){
        if(this.halt){
            console.log("CPU Halted");
        }else{
            this.clock_counter++;
            //Update PC;
            this.PC = this.nextPC;
            //Fetch & Decode instruction
            icd_ifn = mem[this.PC];
            this.icd = d1(icd_ifn);
            this.ifn = d2(icd_ifn);
            this.valc = 0x0;
            this.ra = 0x0;
            this.rb = 0x0;
            if(icd_ifn == "00"){
                this.halt = true;
            }
            read_rab = 0;
            if(this.icd == "3" || this.icd == "6"){
                this.ra = d1(mem[this.PC+1]);
                this.rb = d2(mem[this.PC+1]);
                read_rab = 1;
            }
            if(this.icd == "3" || this.icd == "7"){
                this.valc = parseInt(mem[this.PC+1+read_rab] + 
                            mem[this.PC+2+read_rab] +
                            mem[this.PC+3+read_rab] + 
                            mem[this.PC+4+read_rab], 16);
            }
            switch(this.icd){
                case "0":
                    this.valp = this.PC;
                    this.srca = 0xF;
                    this.srcb = 0xF;
                    this.dste = 0xF;
                    break;
                case "3":
                    this.valp = this.PC + 6;
                    this.srca = 0xF;
                    this.srcb = 0xF;
                    this.dste = this.rb;
                    break;
                case "6":
                    this.valp = this.PC + 2;
                    this.srca = this.ra;
                    this.srcb = this.rb;
                    this.dste = this.rb;
                    break;
                case "7":
                    this.valp = this.PC + 5;
                    this.srca = 0xF;
                    this.srcb = 0xF;
                    this.dste = 0xF;
                    break;
            }
            this.vala = this.regr(this.srca);
            this.valb = this.regr(this.srcb);
            //ALU INIT
            switch(this.icd){
                case "0":
                    this.alua = 0x0;
                    this.alub = 0x0;
                    break;
                case "3":
                case "7":
                    this.alua = this.valc;
                    this.alub = 0x0;
                    break;
                case "6":
                    this.alua = this.vala;
                    this.alub = this.valb;
                    break;
            }
            //BRANCH
            if(this.icd != "7"){
                this.bch = 0;
            }else{
                switch(this.ifn){
                    case "0": 
                        this.bch = 1;
                        this.comm_friendly = "<JMP_UNCOND>";
                        break;
                    case "1": 
                        if(this.vale<=0){
                            this.bch=1;
                            this.comm_friendly = "<JMP_COND> [SATISIFIED]";
                        }else{
                            this.bch=0;
                            this.comm_friendly = "<JMP_COND> [UNSATISIFIED]";
                        }
                        break;
                    case "2": 
                        this.bch = 0
                        break;
                }
            }
            //ALU INST
            if(this.icd != "6"){
                this.vale = this.alub + this.alua; // ALU DEFAULT BEHAVIOUR(ADD)
            }
            if(this.icd == "6"){
                switch(this.ifn){
                    case "0": // ADD
                        this.vale = this.alub + this.alua;
                        this.comm_friendly = "<ALU_ADD>";
                        break;
                    case "1": // SUBSTRACT
                        this.vale = this.alub - this.alua;
                        this.comm_friendly = "<ALU_SUB>";
                        break;
                    case "2": //Bitwise AND
                        this.vale = this.alub & this.alua;
                        this.comm_friendly = "<ALU_AND>";
                        break;
                }
            }
            if(this.icd == "3" && this.ifn == "0"){ // Move value to register
                this.vale = this.valc;
                this.comm_friendly = "<MOVREG>";
            }

            if(this.icd == 7 && this.bch == 1){
                if(this.debug){
                    console.log("Jump triggered!");
                }
                this.nextPC = this.valc;
            }else{
                this.nextPC = this.valp;
            }
            
            this.regw(this.dste, this.vale);
            console.log("\x1b[35mRunning clock cycle \x1b[36m#" + this.clock_counter + " \x1b[34m" + this.comm_friendly + "\x1b[0m");
            //Output all internals
            if(this.debug){
                console.log(
                    {
                        reg : (this.reg).map((x) => toHex(x)),
                        PC : toHex(this.PC),
                        nextPC : toHex(this.nextPC),
                        icd : this.icd,
                        ifn : this.ifn,
                        ra : this.ra,
                        rb : this.rb,
                        valc :  toHex(this.valc),
                        valp :  toHex(this.valp),
                        srca :  toHex(this.srca),
                        srcb :  toHex(this.srcb),
                        dste :  toHex(this.dste),
                        vala :  toHex(this.vala),
                        valb :  toHex(this.valb),
                        vale :  toHex(this.vale),
                        alua :  toHex(this.alua),
                        alub :  toHex(this.alub),
                        bch :  toHex(this.bch)
                    }
                );
            }
            return {
                reg : (this.reg).map((x) => toHex(x)),
                PC : toHex(this.PC),
                nextPC : toHex(this.nextPC),
                icd : this.icd,
                ifn : this.ifn,
                ra : this.ra,
                rb : this.rb,
                valc :  toHex(this.valc),
                valp :  toHex(this.valp),
                srca :  toHex(this.srca),
                srcb :  toHex(this.srcb),
                dste :  toHex(this.dste),
                vala :  toHex(this.vala),
                valb :  toHex(this.valb),
                vale :  toHex(this.vale),
                alua :  toHex(this.alua),
                alub :  toHex(this.alub),
                bch :  toHex(this.bch)
            };
        }
    }
    this.full = function (){
        while(!this.halt){
            this.step();
        }
        console.log("CPU Halted");
    }
}

function d1(num){
    return num[0];
}

function d2(num){
    return num[1];
}

function toHex(num){
    return parseInt(num).toString(16);
}