/*
  Warnings:

  - A unique constraint covering the columns `[title]` on the table `Meal` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Meal_title_key" ON "Meal"("title");
