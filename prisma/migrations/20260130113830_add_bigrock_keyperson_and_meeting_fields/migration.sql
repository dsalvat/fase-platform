-- AlterTable
ALTER TABLE "KeyMeeting" ADD COLUMN     "expectedDecision" TEXT,
ADD COLUMN     "objective" TEXT;

-- CreateTable
CREATE TABLE "_BigRockToKeyPerson" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_BigRockToKeyPerson_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_BigRockToKeyPerson_B_index" ON "_BigRockToKeyPerson"("B");

-- AddForeignKey
ALTER TABLE "_BigRockToKeyPerson" ADD CONSTRAINT "_BigRockToKeyPerson_A_fkey" FOREIGN KEY ("A") REFERENCES "BigRock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BigRockToKeyPerson" ADD CONSTRAINT "_BigRockToKeyPerson_B_fkey" FOREIGN KEY ("B") REFERENCES "KeyPerson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
