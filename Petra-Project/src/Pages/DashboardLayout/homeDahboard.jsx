const dgd = [
    {
        title: "NGN Balance",
        amonut: 0.00
    }
]

export default function HomeDashBoard() {
    const userFirstName = "Temioluwa";
    const schoolName = "Petra Schools";

    const today = new Date();

    const month = today.getMonth();
    const currentYear = today.getFullYear();
    const nextYear = currentYear + 1;
    const lastYear = currentYear - 1;

    let term = "";
    let session = "";

    // First Term: September - December
    if (month >= 8) {
        term = "1st";
        session = `${currentYear}/${nextYear}`;
    }

    // Second Term: January - April
    else if (month <= 3) {
        term = "2nd";
        session = `${lastYear}/${currentYear}`;
    }

    // Third Term: May - August
    else {
        term = "3rd";
        session = `${lastYear}/${currentYear}`;
    }

    return (
        <section>
            <h2>
                Welcome Back, {userFirstName} 👋
            </h2>

            <p>
                Here's the latest activity happening at {schoolName}.
            </p>

            <h3>
                {term} Term • {session} Academic Session
            </h3>

            <div className="">

            </div>
        </section>
    );
}