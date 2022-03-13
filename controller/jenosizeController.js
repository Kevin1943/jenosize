const express = require("express");
const router = express.Router();

const { initializeApp } = require("firebase-admin/app");

router.index = async (req, res, next) => {
  try {
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
};

router.game = async (req, res, next) => {
  try {
    let body = req.body;

    // receive num1, num2, num3, num4

    let targetNum = 24;

    let output = solveFor(
      targetNum,
      body.num1,
      body.num2,
      body.num3,
      body.num4
    );

    if (output) {
      res.status(200).json({
        solveAble: true,
        solveFormula: output,
      });
    } else {
      res.status(200).json({
        solveAble: output,
      });
    }
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
};

router.login = async (req, res, next) => {
  try {
    res.render("login.ejs");
  } catch (error) {
    console.error(error);
    res.status(500);
  }
};

router.profile = async (req, res, next) => {
  try {
    res.render("profile.ejs");
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
};

router.sessionLogIn = async (req, res, next) => {
  try {
    const idToken = req.body.idToken.toString();

    const expiresIn = 60 * 60 * 24 * 5 * 1000;

    admin
      .auth()
      .createSessionCookie(idToken, { expiresIn })
      .then(
        (sessionCookie) => {
          const options = { maxAge: expiresIn, httpOnly: true };
          res.cookie("session", sessionCookie, options);
          res.end(JSON.stringify({ status: "success" }));
        },
        (error) => {
          res.status(401).send("UNAUTHORIZED REQUEST!");
        }
      );
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
};

router.sessionLogOut = async (req, res, next) => {
  try {
    res.clearCookie("session");
    res.redirect("/login");
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
};

function solveFor(targetNum, a, b, c, d) {
  const target = parseInt(targetNum, 10);
  const symbol = {
    add: "+",
    subtract: "-",
    multiply: "*",
    divide: "/",
  };

  return solve(a, b, c, d);

  function solve() {
    const numbers = [...arguments];
    const numberPermutations = permute(numbers);

    const operations = Object.keys(symbol);
    const operationCombinations = combinations(operations.length, 3).map(
      (combo) => {
        return combo.map((i) => operations[i]);
      }
    );

    const groupCombinations = combinations(numbers.length + 1, 2).filter(
      ([a, b]) => {
        return a > 0 && b - a >= 1;
      }
    );

    for (let n = 0, nLen = numberPermutations.length; n < nLen; n++) {
      let nums = numberPermutations[n];

      for (let o = 0, oLen = operationCombinations.length; o < oLen; o++) {
        let operations = operationCombinations[o];
        let [start, ...innerNums] = nums;

        let calc = innerNums.reduce((c, num, i) => {
          return c[operations[i]](num);
        }, calculator(start));

        if (target === calc.equals()) {
          return calc.toEquation();
        }
      }

      for (let g = 0, gLen = groupCombinations.length; g < gLen; g++) {
        let group = groupCombinations[g];

        for (let o = 0, oLen = operationCombinations.length; o < oLen; o++) {
          let operations = operationCombinations[o];

          let groupedNums = sliceAt(nums, group);
          let groupedOperations = sliceAt(["add", ...operations], group);

          let calc = groupedOperations.reduce((outer, ops, outerIndex) => {
            let [op, ...innerOps] = ops;
            let [num, ...innerNums] = groupedNums[outerIndex];

            if (!innerOps.length) {
              return outer[op](num);
            }

            return outer[op](
              innerNums.reduce((inner, num, innerIndex) => {
                return inner[innerOps[innerIndex]](num);
              }, calculator(num))
            );
          }, calculator());

          if (target === calc.equals()) {
            return calc.toEquation();
          }

          let groupedNumsLen = groupedNums.length;
          let opsGroup = groupedNums.map((grp, i) => {
            let groupLen = grp.length;

            return Math.round(groupLen / groupedNumsLen) + i - groupLen + 1;
          });

          groupedOperations = sliceAt(operations, opsGroup);

          calc = groupedOperations.reduceRight((outer, ops, outerIndex) => {
            let [num, ...innerNums] = groupedNums[outerIndex];
            let innerCalc = calculator(num);

            if (innerNums.length) {
              innerCalc = innerNums.reduce((inner, num, innerIndex) => {
                return inner[ops[innerIndex]](num);
              }, innerCalc);
            }

            return outer ? innerCalc[ops[0]](outer) : innerCalc;
          }, null);

          if (target === calc.equals()) {
            return calc.toEquation();
          }
        }
      }
    }

    return false;
  }

  function sliceAt(arr, points) {
    let len = arr.length;
    let index = points.reduce((carry, point, i, a) => {
      let prev = a[i - 1] || false;
      let next = a[i + 1] || false;

      if (!prev) {
        carry.push([0, point]);
      } else {
        carry.push([prev, point]);
      }

      if (!next) {
        carry.push([point, len]);
      }

      return carry;
    }, []);

    return index
      .map((pos) => {
        return arr.slice(...pos);
      })
      .filter((a) => a.length);
  }

  function permute(permutation) {
    let length = permutation.length,
      result = [permutation.slice()],
      c = Array(length).fill(0),
      i = 1,
      k,
      p;

    while (i < length) {
      if (c[i] < i) {
        k = i % 2 && c[i];
        p = permutation[i];
        permutation[i] = permutation[k];
        permutation[k] = p;
        ++c[i];
        i = 1;
        result.push(permutation.slice());
      } else {
        c[i] = 0;
        ++i;
      }
    }

    return result;
  }

  function combinations(n, c = n) {
    const arr = Array(n)
      .fill(0)
      .map((_, i) => i);

    if (!(c - 1)) {
      return arr;
    }

    return arr.reduce((carry, item) => {
      let set = combinations(n, c - 1);

      return [
        ...carry,
        ...set.map((combo) => {
          if (Symbol.iterator in Object(combo)) {
            return [item, ...combo];
          }

          return [item, combo];
        }),
      ];
    }, []);
  }

  function calculator(num, _history = []) {
    const operation = {
      add: "add",
      subtract: "subtract",
      multiply: "multiply",
      divide: "divide",
    };

    if (undefined !== num && !_history.length) {
      pushHistory(operation.add, [num]);
    }

    return {
      [operation.add]: order(
        historic(instance(add), operation.add),
        operation.add
      ),
      [operation.subtract]: order(
        historic(instance(subtract), operation.subtract),
        operation.subtract
      ),
      [operation.multiply]: order(
        historic(instance(multiply), operation.multiply),
        operation.multiply
      ),
      [operation.divide]: order(
        historic(instance(divide), operation.divide),
        operation.divide
      ),
      equals: () => num,
      history: () => _history,
      toEquation: toEquation,
    };

    function instance(fn) {
      return (...vars) => {
        return calculator(
          fn(resolve(num || 0), ...vars.map(resolve)),
          _history
        );
      };
    }

    function historic(fn, action) {
      return (...vars) => {
        pushHistory(action, vars);
        return fn(...vars);
      };
    }

    function order(fn, action) {
      return (...vars) => {
        if (_history.length > 1) {
          const recentAction = _history.slice(-1)[0].action;

          if (action !== recentAction) {
            resetHistory(operation.add, [calculator(num, _history)]);
          }
        }

        return fn(...vars);
      };
    }

    function add(a, b) {
      return toFloat(a) + toFloat(b);
    }

    function subtract(a, b) {
      return toFloat(a) - toFloat(b);
    }

    function multiply(a, b) {
      return toFloat(a) * toFloat(b);
    }

    function divide(a, b) {
      return toFloat(a) / toFloat(b);
    }

    function resetHistory(action, vars) {
      _history = [];
      pushHistory(action, vars);
    }

    function pushHistory(action, vars) {
      _history = [..._history, { action, vars }];
    }

    function toFloat(f) {
      let n = parseFloat(f, 10);

      return isNaN(n) ? 0 : n;
    }

    function toEquation() {
      return _history
        .reduce((str, record) => {
          let vars = record.vars.map((v) =>
            v.hasOwnProperty("toEquation") ? "(" + v.toEquation() + ")" : v
          );
          let operation = symbol[record.action];
          return str + operation + vars.join(operation);
        }, "")
        .slice(1);
    }

    function resolve(c) {
      return c.hasOwnProperty("equals") ? c.equals() : c;
    }
  }
}
module.exports = router;
