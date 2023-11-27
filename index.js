const init_memory = 
    ["30", "F2", "00", "00", "00", "01",
     "30", "F1", "00", "00", "00", "05",
     "30", "F0", "00", "00", "00", "00",
     "62", "11",
     "71", "00", "00", "00", "22",
     "60", "10",
     "61", "21", 
     "70", "00", "00", "00", "12",
     "00"];
//  Value provided for 2023winter
//  I see literally no point in the complexity of this prelab but okay
const init_register = 
    [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];

var ins = new CPU(true, init_memory, init_register);

ins.full();

//  CPU.halt: Boolean
//  CPU.step() for one clock cycle;
//  CPU.full() for cycling until halt (INST 0x00)

function CPU(debug, mem, reg){
    console.log("VMWinslowARE 1.0.0, emulator created.");
    this.debug = debug; // When true, output all registers/internal status for all clock cycles.
    this.memory = mem;
    this.reg = reg;
    this.PC = 0x0;
    this.nextPC = 0x0;
    this.halt = false;

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
    this.pointer = -1;

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
            this.pointer++;
            //Update PC;
            this.PC = this.nextPC;
            //Fetch & Decode instruction
            icd_ifn = mem[this.pointer];
            this.icd = d1(icd_ifn);
            this.ifn = d2(icd_ifn);
            this.valc = 0x0;
            this.ra = 0x0;
            this.rb = 0x0;
            if(icd_ifn == "00"){
                this.halt = true;
            }
            if(this.icd == "3" || this.icd == "6"){
                this.pointer++;
                this.ra = d1(mem[this.pointer]);
                this.rb = d2(mem[this.pointer]);
            }
            if(this.icd == "3" || this.icd == "7"){
                this.pointer++;
                this.valc = mem[this.pointer] + 
                            mem[this.pointer+1] +
                            mem[this.pointer+2] + 
                            mem[this.pointer+3];
                this.pointer+=3;
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
            
            //EXECUTION
            if(this.icd == "3" || this.ifn == "0"){ // Move value to register
                this.vale = this.valc;
            }
            //ALU INST
            if(this.icd != "6" && (this.ifn == "0"|| this.ifn == "1"|| this.ifn == "2")){
                this.vale = this.alub + this.alua; // ALU DEFAULT BEHAVIOUR(ADD)
            }
            if(this.icd == "6"){
                switch(this.ifn){
                    case "0": // ADD
                        this.vale = this.alub + this.alua;
                        break;
                    case "1": // SUBSTRACT
                        this.vale = this.alub - this.alua;
                        break;
                    case "2": //Bitwise AND
                        this.vale = this.alub & this.alua;
                        break;
                }
            }
            //BRANCH
            if(this.icd != "7" && (this.ifn == "0"|| this.ifn == "1"|| this.ifn == "2")){
                this.bch = 0;
            }
            if(this.icd == "7"){
                switch(this.ifn){
                    case "0": 
                        this.bch = 0;
                        break;
                    case "1": 
                        if(this.vale<=0){
                            this.bch=1;
                        }else{
                            this.bch=0;
                        }
                        break;
                    case "2": 
                        this.bch = 0
                        break;
                }
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
                        bch :  toHex(this.bch),
                        pointer : this.pointer
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
                bch :  toHex(this.bch),
                pointer : this.pointer
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