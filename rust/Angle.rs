use std::cmp::Ordering;
use std::f64::consts::PI;

#[derive(Clone, Copy)]
pub struct Angle {
	value: f64
}
impl Angle {
	pub fn new(value: f64) -> Angle {
		Angle { value: Angle::modulo(value) }
	}

	pub fn get(&self) -> f64 {
		self.value
	}

	pub fn sin(&self) -> f64 {
		self.value.sin()
	}

	pub fn cos(&self) -> f64 {
		self.value.cos()
	}

	pub fn min(&self, min: f64) -> f64 {
		self.value.min(min)
	}

	pub fn max(&self, max: f64) -> f64 {
		self.value.max(max)
	}

	pub fn signum(&self) -> f64 {
		if *self == 0.0 {
			0.0
		} else if self < &PI {
			1.0
		} else {
			-1.0
		}
	}

	fn modulo(value: f64) -> f64 {
		let mut modulated = value;
		while modulated < 0.0 {
			modulated += PI * 2.0
		}
		value % (PI * 2.0)
	}
}
impl std::ops::Add<f64> for Angle {
	type Output = Angle;
	fn add(self, other: f64) -> Self::Output {
		Angle::new(self.value + other)
	}
}
impl std::ops::Add<Angle> for f64 {
	type Output = Angle;
	fn add(self, other: Angle) -> Self::Output {
		Angle::new(self + other.value)
	}
}
impl std::ops::Add<Angle> for Angle {
	type Output = Angle;
	fn add(self, other: Angle) -> Self::Output {
		Angle::new(self.value + other.value)
	}
}
impl std::ops::AddAssign<f64> for Angle {
	fn add_assign(&mut self, other: f64) {
		self.value = Angle::modulo(self.value + other);
	}
}
impl std::ops::Sub<f64> for Angle {
	type Output = Angle;
	fn sub(self, other: f64) -> Self::Output {
		Angle::new(self.value - other)
	}
}
impl std::ops::Sub<Angle> for f64 {
	type Output = Angle;
	fn sub(self, other: Angle) -> Self::Output {
		Angle::new(self - other.value)
	}
}

impl std::ops::Sub<Angle> for Angle {
	type Output = Angle;
	fn sub(self, other: Angle) -> Self::Output {
		Angle::new(self.value - other.value)
	}
}
impl std::ops::SubAssign<f64> for Angle {
	fn sub_assign(&mut self, other: f64) {
		self.value = Angle::modulo(self.value - other);
	}
}
impl std::ops::Div<Angle> for Angle {
	type Output = Angle;
	fn div(self, other: Angle) -> Self::Output {
		Angle::new(self.value / other.value)
	}
}
impl std::ops::Div<f64> for Angle {
	type Output = Angle;
	fn div(self, other: f64) -> Self::Output {
		Angle::new(self.value / other)
	}
}
impl std::ops::Neg for Angle {
	type Output = Angle;
	fn neg(self) -> Self::Output {
		Angle::new(PI * 2.0 - self.value)
	}
}
impl PartialEq<f64> for Angle {
	fn eq(&self, other: &f64) -> bool {
		self.value == *other
	}
}
impl PartialEq<Angle> for Angle {
	fn eq(&self, other: &Angle) -> bool {
		self.value == other.value
	}
}
impl PartialOrd<f64> for Angle {
	fn partial_cmp(&self, other: &f64) -> Option<Ordering> {
		let modulated = Angle::new(*other);
		if self < &modulated {
			Some(Ordering::Less)
		} else if self > &modulated {
			Some(Ordering::Greater)
		} else {
			Some(Ordering::Equal)
		}
    }
}
impl PartialOrd<Angle> for Angle {
	fn partial_cmp(&self, other: &Angle) -> Option<Ordering> {
		if self.value < other.value {
			Some(Ordering::Less)
		} else if self.value > other.value {
			Some(Ordering::Greater)
		} else {
			Some(Ordering::Equal)
		}
    }
}