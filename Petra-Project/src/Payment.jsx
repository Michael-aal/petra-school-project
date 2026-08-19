import { useState } from "react";
import "./Payment.css";

const paymentItems = [
  {
    id: "school-fees",
    name: "School Fees",
    price: 90000,
    maxQuantity: 1,
  },
  {
    id: "textbooks",
    name: "Textbooks",
    price: 5000,
    maxQuantity: 10,
  },
  {
    id: "uniform",
    name: "School Uniform",
    price: 12000,
    maxQuantity: 5,
  },
  {
    id: "sportswear",
    name: "Sportswear",
    price: 10000,
    maxQuantity: 3,
  },
];

function Payment() {
  const [studentId, setStudentId] = useState("");
  const [student, setStudent] = useState(null);

  const [selectedPayments, setSelectedPayments] = useState({});

  const findStudent = () => {
    const id = studentId.trim().toUpperCase();

    if (!id) {
      alert("Please enter a student ID");
      return;
    }

    // TEST STUDENT
    if (id === "PET-22312") {
      setStudent({
        id: "PET-22312",
        fullName: "John Adewale",
      });
      return;
    }

    setStudent(null);
    alert("Student not found. Try PET-22312");
  };

  const handlePaymentToggle = (item) => {
    setSelectedPayments((previous) => {
      const updated = { ...previous };

      if (updated[item.id]) {
        delete updated[item.id];
      } else {
        updated[item.id] = {
          quantity: 1,
          price: item.price,
        };
      }

      return updated;
    });
  };

  const changeQuantity = (item, quantity) => {
    setSelectedPayments((previous) => ({
      ...previous,
      [item.id]: {
        ...previous[item.id],
        quantity,
      },
    }));
  };

  const totalAmount = Object.entries(selectedPayments).reduce(
    (total, [itemId, payment]) => {
      const item = paymentItems.find(
        (item) => item.id === itemId
      );

      return total + item.price * payment.quantity;
    },
    0
  );

  const formatMoney = (amount) => {
    return `₦${amount.toLocaleString()}`;
  };

  const continuePayment = () => {
    if (totalAmount === 0) {
      alert("Please select what you want to pay for.");
      return;
    }

    console.log({
      student: student,
      payments: selectedPayments,
      total: totalAmount,
    });

    alert(`Payment total: ${formatMoney(totalAmount)}`);
  };

  return (
    <div className="payment-screen">
      <div className="payment-container">

        {/* HEADER */}

        <div className="payment-header">
          <div className="logo">PETRA</div>
          <span>School Portal</span>
        </div>


        {/* TITLE */}

        <div className="payment-content">

          <div className="payment-title">
            <h1>Make Payment</h1>

            <p>
              Enter your student ID to make a payment.
            </p>
          </div>


          {/* MAIN CARD */}

          <div className="payment-card">

            {/* STUDENT ID */}

            <label>
              Student ID
            </label>

            <div className="student-input">

              <input
                type="text"
                placeholder="e.g. PET-22312"
                value={studentId}
                onChange={(e) =>
                  setStudentId(e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    findStudent();
                  }
                }}
              />

              <button onClick={findStudent}>
                Find Student
              </button>

            </div>


            {/* STUDENT INFORMATION */}

            {student && (
              <div className="student-result">

                <div className="student-info">
                  <span>Student</span>

                  <strong>
                    {student.fullName}
                  </strong>
                </div>

                <div className="student-info">
                  <span>Student ID</span>

                  <strong>
                    {student.id}
                  </strong>
                </div>

              </div>
            )}


            {/* PAYMENT OPTIONS */}

        
              <div className="payment-options">

                <div className="section-heading">

                  <h2>
                    What would you like to pay for?
                  </h2>

                  <p>
                    Select a payment and choose the quantity.
                  </p>

                </div>


                {paymentItems.map((item) => {

                  const selected =
                    selectedPayments[item.id];

                  return (
                    <div
                      key={item.id}
                      className={`payment-item ${
                        selected ? "selected" : ""
                      }`}
                    >

                      {/* PAYMENT NAME */}

                      <div className="payment-item-left">

                        <input
                          type="checkbox"
                          checked={!!selected}
                          onChange={() =>
                            handlePaymentToggle(item)
                          }
                        />

                        <div>

                          <h3>
                            {item.name}
                          </h3>

                          <p>
                            {formatMoney(item.price)} per unit
                          </p>

                        </div>

                      </div>


                      {/* QUANTITY */}

                      {selected && (
                        <div className="quantity-control">

                          <button
                            onClick={() =>
                              changeQuantity(
                                item,
                                Math.max(
                                  1,
                                  selected.quantity - 1
                                )
                              )
                            }
                          >
                            −
                          </button>

                          <span>
                            {selected.quantity}
                          </span>

                          <button
                            onClick={() =>
                              changeQuantity(
                                item,
                                Math.min(
                                  item.maxQuantity,
                                  selected.quantity + 1
                                )
                              )
                            }
                          >
                            +
                          </button>

                        </div>
                      )}


                      {/* ITEM TOTAL */}

                      {selected && (
                        <strong className="item-total">

                          {formatMoney(
                            item.price *
                            selected.quantity
                          )}

                        </strong>
                      )}

                    </div>
                  );
                })}


                {/* TOTAL */}

                <div className="payment-total">

                  <div>

                    <span>
                      Total Amount
                    </span>

                    <strong>
                      {formatMoney(totalAmount)}
                    </strong>

                  </div>


                  <button
                    className="continue-button"
                    onClick={continuePayment}
                    disabled={totalAmount === 0}
                  >
                    Continue to Payment →
                  </button>

                </div>

              </div>
        

          </div>


          <p className="secure-text">
            🔒 Secure payment powered by Paystack
          </p>

        </div>
      </div>
    </div>
  );
}

export default Payment;